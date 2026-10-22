import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { createHash } from 'node:crypto';
import {
  applyFilePlan,
  renderFilePlan,
  createBackupStamp,
  confirmFilePlan,
  executeFilePlan,
  FilePlan,
} from '../src/core/file-plan.js';
import { fileExists, listFilesRecursive } from '../src/utils/fs-helpers.js';
import { CliIO } from '../src/utils/prompt.js';

const STAMP = '20261022-090507';
const ORIGINAL = Buffer.from('# Reglas del equipo\r\nNo tocar.\r\n', 'utf-8');
const UPDATED = Buffer.from('# Reglas del equipo\r\nNo tocar.\r\n\r\n<!-- SDD:BEGIN -->\r\nx\r\n<!-- SDD:END -->\r\n', 'utf-8');

describe('File Plan Module (apply, backups and rendering)', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-test-file-plan-'));
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  async function writeRaw(relPath: string, content: Buffer): Promise<void> {
    await fs.mkdir(path.dirname(path.join(root, relPath)), { recursive: true });
    await fs.writeFile(path.join(root, relPath), content);
  }

  async function readRaw(relPath: string): Promise<Buffer> {
    return fs.readFile(path.join(root, relPath));
  }

  it('should copy the original bytes to .sdd/backups/<stamp>/ before modifying', async () => {
    await writeRaw('.github/copilot-instructions.md', ORIGINAL);
    const plan: FilePlan = {
      changes: [{ kind: 'modify', relPath: '.github/copilot-instructions.md', before: ORIGINAL, after: UPDATED, backup: true }],
      warnings: [],
    };

    const report = await applyFilePlan(plan, root, STAMP);

    const backupRel = `.sdd/backups/${STAMP}/.github/copilot-instructions.md`;
    expect(Buffer.compare(await readRaw(backupRel), ORIGINAL)).toBe(0);
    expect(Buffer.compare(await readRaw('.github/copilot-instructions.md'), UPDATED)).toBe(0);
    expect(report.backups).toEqual([backupRel]);
    expect(report.written).toEqual(['.github/copilot-instructions.md']);
  });

  it('should not create any backup when the change does not ask for one', async () => {
    await writeRaw('CLAUDE.md', ORIGINAL);
    const plan: FilePlan = {
      changes: [{ kind: 'modify', relPath: 'CLAUDE.md', before: ORIGINAL, after: UPDATED, backup: false }],
      warnings: [],
    };

    const report = await applyFilePlan(plan, root, STAMP);

    expect(report.backups).toEqual([]);
    expect(await fileExists(path.join(root, '.sdd', 'backups'))).toBe(false);
  });

  it('should skip error changes, report them and still apply the rest', async () => {
    await writeRaw('CLAUDE.md', ORIGINAL);
    const plan: FilePlan = {
      changes: [
        { kind: 'error', relPath: 'CLAUDE.md', message: 'BEGIN sin END', line: 4 },
        { kind: 'create', relPath: '.sdd/constitution.md', after: Buffer.from('# Constitución\n', 'utf-8') },
      ],
      warnings: [],
    };

    const report = await applyFilePlan(plan, root, STAMP);

    expect(Buffer.compare(await readRaw('CLAUDE.md'), ORIGINAL)).toBe(0);
    expect(report.errors).toEqual([{ kind: 'error', relPath: 'CLAUDE.md', message: 'BEGIN sin END', line: 4 }]);
    expect((await readRaw('.sdd/constitution.md')).toString('utf-8')).toBe('# Constitución\n');
    expect(report.written).toEqual(['.sdd/constitution.md']);
  });

  it('should refuse to overwrite a file that changed after the plan was computed', async () => {
    const editedMeanwhile = Buffer.from('# Editado por una persona mientras tanto\n', 'utf-8');
    await writeRaw('CLAUDE.md', editedMeanwhile);
    const plan: FilePlan = {
      changes: [{ kind: 'modify', relPath: 'CLAUDE.md', before: ORIGINAL, after: UPDATED, backup: true }],
      warnings: [],
    };

    const report = await applyFilePlan(plan, root, STAMP);

    expect(Buffer.compare(await readRaw('CLAUDE.md'), editedMeanwhile)).toBe(0);
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0].relPath).toBe('CLAUDE.md');
    expect(report.backups).toEqual([]);
  });

  it('should refuse to create a file that already exists', async () => {
    const existing = Buffer.from('ya existía\n', 'utf-8');
    await writeRaw('.sdd/constitution.md', existing);
    const plan: FilePlan = {
      changes: [{ kind: 'create', relPath: '.sdd/constitution.md', after: Buffer.from('nueva\n', 'utf-8') }],
      warnings: [],
    };

    const report = await applyFilePlan(plan, root, STAMP);

    expect(Buffer.compare(await readRaw('.sdd/constitution.md'), existing)).toBe(0);
    expect(report.errors).toHaveLength(1);
  });

  it('should refuse paths that escape the project root', async () => {
    const plan: FilePlan = {
      changes: [{ kind: 'create', relPath: '../fuera.md', after: Buffer.from('x', 'utf-8') }],
      warnings: [],
    };

    const report = await applyFilePlan(plan, root, STAMP);

    expect(await fileExists(path.join(root, '..', 'fuera.md'))).toBe(false);
    expect(report.errors).toHaveLength(1);
  });

  it('should render every path with its diff, creations as line counts and errors with their line', () => {
    const plan: FilePlan = {
      changes: [
        { kind: 'create', relPath: '.sdd/constitution.md', after: Buffer.from('a\nb\nc\n', 'utf-8') },
        { kind: 'modify', relPath: 'CLAUDE.md', before: ORIGINAL, after: UPDATED, backup: true },
        { kind: 'error', relPath: '.cursorrules', message: 'hay más de un bloque SDD', line: 9 },
      ],
      warnings: ['AGENTS.md editado tras el banner: se conserva su texto'],
    };

    const output = renderFilePlan(plan);

    expect(output).toContain('.sdd/constitution.md (3 líneas)');
    expect(output).not.toContain('+++ b/.sdd/constitution.md');
    expect(output).toContain('CLAUDE.md (con respaldo)');
    expect(output).toContain('--- a/CLAUDE.md');
    expect(output).toContain('+<!-- SDD:BEGIN -->');
    expect(output).toContain('.cursorrules: hay más de un bloque SDD (línea 9)');
    expect(output).toContain('AGENTS.md editado tras el banner: se conserva su texto');
    expect(output).not.toContain('\r');
  });

  it('should render an empty plan as no changes', () => {
    expect(renderFilePlan({ changes: [], warnings: [] })).toBe('Sin cambios.');
  });

  it('should build the backup stamp as AAAAMMDD-HHMMSS in local time', () => {
    expect(createBackupStamp(new Date(2026, 9, 22, 9, 5, 7))).toBe(STAMP);
  });
});

describe('File Plan Module (confirmation, --dry-run and exit codes)', () => {
  let root: string;
  let logs: string[];

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-test-file-plan-exec-'));
    logs = [];
    await fs.writeFile(path.join(root, 'CLAUDE.md'), ORIGINAL);
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  function fakeIO(isTTY: boolean, answer = ''): { io: CliIO; questions: string[] } {
    const questions: string[] = [];
    return { io: { isTTY, ask: async (question) => (questions.push(question), answer) }, questions };
  }

  async function hashDirectory(): Promise<Record<string, string>> {
    const hashes: Record<string, string> = {};
    for (const file of await listFilesRecursive(root)) {
      hashes[path.relative(root, file)] = createHash('sha256').update(await fs.readFile(file)).digest('hex');
    }
    return hashes;
  }

  function bridgePlan(): FilePlan {
    return {
      changes: [
        { kind: 'modify', relPath: 'CLAUDE.md', before: ORIGINAL, after: UPDATED, backup: true },
        { kind: 'create', relPath: '.sdd/constitution.md', after: Buffer.from('# Constitución\n', 'utf-8') },
      ],
      warnings: [],
    };
  }

  async function run(plan: FilePlan, io: CliIO, flags: { dryRun?: boolean; yes?: boolean } = {}) {
    return executeFilePlan(plan, {
      root,
      io,
      dryRun: flags.dryRun ?? false,
      yes: flags.yes ?? false,
      stamp: STAMP,
      log: (message) => logs.push(message),
    });
  }

  it('should show the plan and write nothing with --dry-run', async () => {
    const before = await hashDirectory();
    const { io, questions } = fakeIO(true, 's');

    const result = await run(bridgePlan(), io, { dryRun: true });

    expect(result.exitCode).toBe(0);
    expect(await hashDirectory()).toEqual(before);
    expect(questions).toHaveLength(0);
    expect(logs.join('\n')).toContain('--- a/CLAUDE.md');
  });

  it('should predict exit code 1 in --dry-run when the plan has errors', async () => {
    const plan: FilePlan = { changes: [{ kind: 'error', relPath: 'CLAUDE.md', message: 'BEGIN sin END', line: 2 }], warnings: [] };

    const result = await run(plan, fakeIO(false).io, { dryRun: true });

    expect(result.exitCode).toBe(1);
  });

  it('should write nothing when the user answers no in an interactive terminal', async () => {
    const before = await hashDirectory();
    const { io, questions } = fakeIO(true, 'n');

    const result = await run(bridgePlan(), io);

    expect(result).toMatchObject({ exitCode: 0, cancelled: true });
    expect(await hashDirectory()).toEqual(before);
    expect(questions).toHaveLength(1);
    expect(questions[0]).toContain('CLAUDE.md');
  });

  it('should apply the plan when the user answers yes', async () => {
    const result = await run(bridgePlan(), fakeIO(true, 'sí').io);

    expect(result).toMatchObject({ exitCode: 0, cancelled: false });
    expect(Buffer.compare(await fs.readFile(path.join(root, 'CLAUDE.md')), UPDATED)).toBe(0);
    expect(logs.join('\n')).toContain(`.sdd/backups/${STAMP}/CLAUDE.md`);
  });

  it('should apply without asking with --yes or without a terminal', async () => {
    const withYes = fakeIO(true, 'n');
    expect((await run(bridgePlan(), withYes.io, { yes: true })).exitCode).toBe(0);
    expect(withYes.questions).toHaveLength(0);

    await fs.writeFile(path.join(root, 'CLAUDE.md'), ORIGINAL);
    await fs.rm(path.join(root, '.sdd'), { recursive: true, force: true });
    const withoutTTY = fakeIO(false, 'n');
    expect((await run(bridgePlan(), withoutTTY.io)).exitCode).toBe(0);
    expect(withoutTTY.questions).toHaveLength(0);
    expect(Buffer.compare(await fs.readFile(path.join(root, 'CLAUDE.md')), UPDATED)).toBe(0);
  });

  it('should not ask when the plan only creates new files', async () => {
    const plan: FilePlan = { changes: [bridgePlan().changes[1]], warnings: [] };
    const { io, questions } = fakeIO(true, 'n');

    expect(await confirmFilePlan(plan, io)).toBe(true);
    expect(questions).toHaveLength(0);
  });

  it('should apply the valid changes and return exit code 1 when some change fails', async () => {
    const plan: FilePlan = {
      changes: [
        { kind: 'error', relPath: '.cursorrules', message: 'hay más de un bloque SDD', line: 9 },
        bridgePlan().changes[1],
      ],
      warnings: [],
    };

    const result = await run(plan, fakeIO(false).io);

    expect(result.exitCode).toBe(1);
    expect(await fileExists(path.join(root, '.sdd', 'constitution.md'))).toBe(true);
    expect(logs.join('\n')).toContain('.cursorrules');
  });
});
