import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { syncBridges, planBridgeSync, CONSTITUTION_PATH } from '../src/core/bridges.js';
import { BLOCK_BEGIN, BLOCK_END } from '../src/core/managed-block.js';
import { fileExists, listFilesRecursive } from '../src/utils/fs-helpers.js';

const CONSTITUTION = '# Constitución SDD\n\n1. Ningún código sin REQ-ID.\n';
const TEAM_CLAUDE = Buffer.from('# CLAUDE.md del equipo\n\nReglas propias que SDD no debe tocar.\n', 'utf-8');
const TEAM_AGENTS = Buffer.from('# AGENTS.md del equipo (espejo para Codex)\n\nMás reglas propias.\n', 'utf-8');

describe('Bridges Module (managed block, constitution source)', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-test-bridges-'));
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  async function writeRaw(relPath: string, content: Buffer | string): Promise<void> {
    await fs.mkdir(path.dirname(path.join(root, relPath)), { recursive: true });
    await fs.writeFile(path.join(root, relPath), content);
  }

  async function readText(relPath: string): Promise<string> {
    return fs.readFile(path.join(root, relPath), 'utf-8');
  }

  function blockBody(text: string): string {
    const start = text.indexOf(BLOCK_BEGIN) + BLOCK_BEGIN.length;
    return text.slice(start, text.indexOf(BLOCK_END)).trim();
  }

  function countBlocks(text: string): number {
    return text.split(BLOCK_BEGIN).length - 1;
  }

  async function hashDirectory(): Promise<Record<string, string>> {
    const hashes: Record<string, string> = {};
    for (const file of await listFilesRecursive(root)) {
      hashes[path.relative(root, file)] = createHash('sha256').update(await fs.readFile(file)).digest('hex');
    }
    return hashes;
  }

  it('should keep the team content as an exact prefix with a single block after two syncs', async () => {
    await writeRaw(CONSTITUTION_PATH, CONSTITUTION);
    await writeRaw('CLAUDE.md', TEAM_CLAUDE);
    await writeRaw('AGENTS.md', TEAM_AGENTS);

    await syncBridges(root, ['claude', 'cursor']);
    const second = await syncBridges(root, ['claude', 'cursor']);

    for (const [relPath, original] of [['CLAUDE.md', TEAM_CLAUDE], ['AGENTS.md', TEAM_AGENTS]] as const) {
      const raw = await fs.readFile(path.join(root, relPath));
      expect(Buffer.compare(raw.subarray(0, original.length), original)).toBe(0);
      expect(countBlocks(raw.toString('utf-8'))).toBe(1);
    }
    expect(second.backups).toEqual([]);
    expect((await planBridgeSync(root, ['claude', 'cursor'])).changes).toEqual([]);
  });

  it('should import the constitution in CLAUDE.md and inline it in the other bridges', async () => {
    await writeRaw(CONSTITUTION_PATH, CONSTITUTION);

    const report = await syncBridges(root, ['claude', 'cursor', 'copilot', 'antigravity']);

    expect(blockBody(await readText('CLAUDE.md'))).toBe('@.sdd/constitution.md');
    for (const relPath of ['.cursorrules', '.github/copilot-instructions.md', '.agents/rules/sdd-rules.md', 'AGENTS.md']) {
      const body = blockBody(await readText(relPath));
      expect(body).toContain('Origen: .sdd/constitution.md');
      expect(body).toContain('1. Ningún código sin REQ-ID.');
    }
    expect(report.synced).toEqual(['claude', 'cursor', 'copilot', 'antigravity']);
    expect(report.failed).toEqual([]);
  });

  it('should only back up files that receive the block for the first time', async () => {
    await writeRaw(CONSTITUTION_PATH, CONSTITUTION);
    await writeRaw('CLAUDE.md', TEAM_CLAUDE);

    const first = await syncBridges(root, ['claude']);

    expect(first.backups).toHaveLength(1);
    expect(first.backups[0]).toMatch(/^\.sdd\/backups\/\d{8}-\d{6}\/CLAUDE\.md$/);
    expect(Buffer.compare(await fs.readFile(path.join(root, first.backups[0])), TEAM_CLAUDE)).toBe(0);
  });

  it('should abort without touching anything when there is no constitution to use', async () => {
    await writeRaw('AGENTS.md', TEAM_AGENTS);
    await writeRaw('CLAUDE.md', TEAM_CLAUDE);
    const before = await hashDirectory();

    await expect(syncBridges(root, ['claude', 'cursor'])).rejects.toThrow(/sdd init/);
    expect(await hashDirectory()).toEqual(before);
  });

  it('should report unknown bridge identifiers as skipped', async () => {
    await writeRaw(CONSTITUTION_PATH, CONSTITUTION);

    const report = await syncBridges(root, ['claude', 'windsurf' as never]);

    expect(report.synced).toEqual(['claude']);
    expect(report.skipped).toEqual(['windsurf']);
  });
});

describe('Bridges Module (per-file errors, encoding and line endings)', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-test-bridges-errors-'));
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  async function writeRaw(relPath: string, content: Buffer | string): Promise<void> {
    await fs.mkdir(path.dirname(path.join(root, relPath)), { recursive: true });
    await fs.writeFile(path.join(root, relPath), content);
  }

  async function readRaw(relPath: string): Promise<Buffer> {
    return fs.readFile(path.join(root, relPath));
  }

  it('should leave a file with an unclosed block untouched, report its line and update the rest', async () => {
    const broken = Buffer.from(`# Reglas\n\n${BLOCK_BEGIN}\nsin cierre\n`, 'utf-8');
    await writeRaw(CONSTITUTION_PATH, CONSTITUTION);
    await writeRaw('CLAUDE.md', broken);

    const report = await syncBridges(root, ['claude', 'cursor']);

    expect(Buffer.compare(await readRaw('CLAUDE.md'), broken)).toBe(0);
    expect(report.failed).toHaveLength(1);
    expect(report.failed[0]).toMatchObject({ relPath: 'CLAUDE.md', line: 3 });
    expect(report.failed[0].message).toContain(BLOCK_END);
    expect((await readRaw('.cursorrules')).toString('utf-8')).toContain(BLOCK_BEGIN);
    expect(report.synced).toEqual(['cursor']);
    expect(report.skipped).toEqual(['claude']);
  });

  it('should keep the BOM at byte 0 and write the block with CRLF in a CRLF file', async () => {
    const original = Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]),
      Buffer.from('# Reglas del equipo\r\nLínea con acentos: ñ\r\n', 'utf-8'),
    ]);
    await writeRaw(CONSTITUTION_PATH, CONSTITUTION);
    await writeRaw('CLAUDE.md', original);

    await syncBridges(root, ['claude']);

    const raw = await readRaw('CLAUDE.md');
    expect([...raw.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(Buffer.compare(raw.subarray(0, original.length), original)).toBe(0);
    expect(/(?<!\r)\n/.test(raw.toString('utf-8'))).toBe(false);
  });

  it('should not touch a Windows-1252 file and report it as an encoding error', async () => {
    const cp1252 = Buffer.from([0x23, 0x20, 0x52, 0x65, 0x67, 0x6c, 0x61, 0x73, 0x20, 0xe9, 0xf1, 0x0d, 0x0a]);
    await writeRaw(CONSTITUTION_PATH, CONSTITUTION);
    await writeRaw('CLAUDE.md', cp1252);

    const report = await syncBridges(root, ['claude']);

    expect(Buffer.compare(await readRaw('CLAUDE.md'), cp1252)).toBe(0);
    expect(report.failed).toHaveLength(1);
    expect(report.failed[0].message).toContain('UTF-8');
  });

  it('should treat a Windows-1252 AGENTS.md as the team file, not as a 1.x constitution', async () => {
    const cp1252 = Buffer.from([0x23, 0x20, 0x41, 0x47, 0x45, 0x4e, 0x54, 0x53, 0x20, 0xe9, 0x0d, 0x0a]);
    await writeRaw('AGENTS.md', cp1252);

    await expect(syncBridges(root, ['claude'])).rejects.toThrow(/sdd init/);
    expect(Buffer.compare(await readRaw('AGENTS.md'), cp1252)).toBe(0);
  });

  it('should abort before writing when the constitution itself contains a block marker', async () => {
    await writeRaw(CONSTITUTION_PATH, `# Constitución\n\nEjemplo:\n${BLOCK_BEGIN}\n`);
    await writeRaw('CLAUDE.md', 'reglas\n');

    await expect(syncBridges(root, ['claude', 'cursor'])).rejects.toThrow(/marcador/);
    expect((await readRaw('CLAUDE.md')).toString('utf-8')).toBe('reglas\n');
    expect(await fileExists(path.join(root, '.cursorrules'))).toBe(false);
  });
});
