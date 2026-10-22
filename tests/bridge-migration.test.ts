import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { classifyLegacyBridge, LEGACY_BANNERS } from '../src/core/bridge-migration.js';
import { syncBridges, planBridgeSync, CONSTITUTION_PATH } from '../src/core/bridges.js';
import { BLOCK_BEGIN, BLOCK_END } from '../src/core/managed-block.js';

const [SYNC_BANNER, ANTIGRAVITY_BANNER] = LEGACY_BANNERS;
const AGENTS = '# Constitución del equipo\n\nReglas que SDD 1.x copiaba a los puentes.\n';

function legacyCopy(banner: string, agents: string, eol = '\n'): string {
  return `${banner}${eol}${eol}${agents}`;
}

describe('Bridge Migration Module (classifying 1.x bridges)', () => {
  it('should recognise an exact copy of AGENTS.md after the sync banner', () => {
    expect(classifyLegacyBridge(legacyCopy(SYNC_BANNER, AGENTS), AGENTS)).toBe('pure-copy');
  });

  it('should recognise the Antigravity banner too', () => {
    expect(classifyLegacyBridge(legacyCopy(ANTIGRAVITY_BANNER, AGENTS), AGENTS)).toBe('pure-copy');
  });

  it('should tolerate CRLF checkouts and a BOM copied after the banner', () => {
    const agentsCrlf = AGENTS.replace(/\n/g, '\r\n');

    expect(classifyLegacyBridge(legacyCopy(SYNC_BANNER, agentsCrlf, '\r\n'), agentsCrlf)).toBe('pure-copy');
    expect(classifyLegacyBridge(legacyCopy(SYNC_BANNER, agentsCrlf, '\r\n'), AGENTS)).toBe('pure-copy');
    expect(classifyLegacyBridge(legacyCopy(SYNC_BANNER, `﻿${AGENTS}`), AGENTS)).toBe('pure-copy');
  });

  it('should classify a bridge edited after the copy as edited', () => {
    const edited = `${legacyCopy(SYNC_BANNER, AGENTS)}\nRegla añadida a mano.\n`;

    expect(classifyLegacyBridge(edited, AGENTS)).toBe('edited');
    expect(classifyLegacyBridge(legacyCopy(SYNC_BANNER, AGENTS), null)).toBe('edited');
  });

  it('should ignore files without banner and bridges that already have the block', () => {
    expect(classifyLegacyBridge(AGENTS, AGENTS)).toBe('none');
    const alreadyMigrated = `${legacyCopy(SYNC_BANNER, AGENTS)}\n${BLOCK_BEGIN}\nx\n${BLOCK_END}\n`;
    expect(classifyLegacyBridge(alreadyMigrated, AGENTS)).toBe('none');
  });
});

describe('Bridge Migration Module (sync of a 1.x project)', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-test-migration-'));
    await writeRaw(CONSTITUTION_PATH, '# Constitución SDD\n');
    await writeRaw('AGENTS.md', AGENTS);
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  async function writeRaw(relPath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(path.join(root, relPath)), { recursive: true });
    await fs.writeFile(path.join(root, relPath), content, 'utf-8');
  }

  async function readText(relPath: string): Promise<string> {
    return fs.readFile(path.join(root, relPath), 'utf-8');
  }

  it('should leave only the block in pure copies and back up their original bytes', async () => {
    const copies: Record<string, string> = {
      'CLAUDE.md': legacyCopy(SYNC_BANNER, AGENTS),
      '.cursorrules': legacyCopy(SYNC_BANNER, AGENTS),
      '.agents/rules/sdd-rules.md': legacyCopy(ANTIGRAVITY_BANNER, AGENTS),
    };
    for (const [relPath, content] of Object.entries(copies)) await writeRaw(relPath, content);

    expect((await planBridgeSync(root, ['claude', 'cursor', 'antigravity'])).warnings).toEqual([]);
    const report = await syncBridges(root, ['claude', 'cursor', 'antigravity']);

    expect(await readText('CLAUDE.md')).toBe(`${BLOCK_BEGIN}\n@.sdd/constitution.md\n${BLOCK_END}\n`);
    for (const relPath of Object.keys(copies)) {
      const text = await readText(relPath);
      expect(text.startsWith(BLOCK_BEGIN)).toBe(true);
      expect(text).not.toContain('SINCRONIZADO AUTOMÁTICAMENTE');
      expect(text).not.toContain('Reglas que SDD 1.x copiaba');
    }
    // AGENTS.md también recibe el bloque por primera vez, así que también se respalda.
    const originals: Record<string, string> = { ...copies, 'AGENTS.md': AGENTS };
    expect(report.backups).toHaveLength(4);
    for (const backup of report.backups) {
      const relPath = backup.split('/').slice(3).join('/');
      expect(await readText(backup)).toBe(originals[relPath]);
    }
  });

  it('should keep an edited bridge, append the block and warn with its path', async () => {
    const edited = `${legacyCopy(SYNC_BANNER, AGENTS)}\nRegla añadida a mano.\n`;
    await writeRaw('CLAUDE.md', edited);

    const plan = await planBridgeSync(root, ['claude']);
    const report = await syncBridges(root, ['claude']);

    expect(plan.warnings).toHaveLength(1);
    expect(plan.warnings[0]).toContain('CLAUDE.md');
    expect(report.warnings).toEqual(plan.warnings);
    const text = await readText('CLAUDE.md');
    expect(text.startsWith(edited)).toBe(true);
    expect(text).toContain(`${BLOCK_BEGIN}\n@.sdd/constitution.md\n${BLOCK_END}`);
    expect(report.backups.filter((backup) => backup.endsWith('/CLAUDE.md'))).toHaveLength(1);

    const again = await planBridgeSync(root, ['claude']);
    expect(again.changes).toEqual([]);
    expect(again.warnings).toEqual([]);
  });
});

describe('Bridge Migration Module (1.x constitution in AGENTS.md)', () => {
  let root: string;
  const BOM = Buffer.from([0xef, 0xbb, 0xbf]);
  const LEGACY_AGENTS = Buffer.concat([
    BOM,
    Buffer.from('# Constitución del Proyecto: legacy-app\r\n\r\n1. Reglas generadas por SDD 1.x.\r\n', 'utf-8'),
  ]);

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-test-migration-agents-'));
    await fs.writeFile(path.join(root, 'AGENTS.md'), LEGACY_AGENTS);
    const legacyClaude = `${SYNC_BANNER}\r\n\r\n${LEGACY_AGENTS.toString('utf-8')}`;
    await fs.writeFile(path.join(root, 'CLAUDE.md'), legacyClaude, 'utf-8');
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  async function readRaw(relPath: string): Promise<Buffer> {
    return fs.readFile(path.join(root, relPath));
  }

  it('should plan the move without writing anything', async () => {
    const plan = await planBridgeSync(root, ['claude']);

    expect(plan.changes.find((change) => change.relPath === CONSTITUTION_PATH)?.kind).toBe('create');
    expect(plan.changes.find((change) => change.relPath === 'AGENTS.md')).toMatchObject({ kind: 'modify', backup: true });
    await expect(fs.access(path.join(root, CONSTITUTION_PATH))).rejects.toThrow();
  });

  it('should move the 1.x constitution byte for byte and leave only the block in AGENTS.md', async () => {
    const report = await syncBridges(root, ['claude']);

    expect(Buffer.compare(await readRaw(CONSTITUTION_PATH), LEGACY_AGENTS)).toBe(0);

    const agents = (await readRaw('AGENTS.md')).toString('utf-8').replace(/^\uFEFF/, '');
    expect(agents.startsWith(BLOCK_BEGIN)).toBe(true);
    expect(agents.trimEnd().endsWith(BLOCK_END)).toBe(true);
    expect(agents).toContain('Origen: .sdd/constitution.md');
    expect(agents.split(BLOCK_BEGIN)).toHaveLength(2);

    const agentsBackup = report.backups.find((backup) => backup.endsWith('/AGENTS.md'));
    expect(agentsBackup).toBeDefined();
    expect(Buffer.compare(await readRaw(agentsBackup as string), LEGACY_AGENTS)).toBe(0);
  });

  it('should compare the 1.x bridges against AGENTS.md as it was before the move', async () => {
    await syncBridges(root, ['claude']);

    expect((await readRaw('CLAUDE.md')).toString('utf-8')).toBe(
      `${BLOCK_BEGIN}\r\n@.sdd/constitution.md\r\n${BLOCK_END}\r\n`
    );
  });

  it('should leave nothing else to do on the next sync', async () => {
    await syncBridges(root, ['claude']);

    const again = await planBridgeSync(root, ['claude']);

    expect(again.changes).toEqual([]);
    expect(again.warnings).toEqual([]);
  });
});
