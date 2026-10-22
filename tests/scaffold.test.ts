import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { scaffoldProject, planScaffold, planReverse } from '../src/core/scaffold.js';
import { renderFilePlan } from '../src/core/file-plan.js';
import { BLOCK_BEGIN } from '../src/core/managed-block.js';
import { fileExists, readFileUtf8, listFilesRecursive } from '../src/utils/fs-helpers.js';

describe('Scaffold Module (sdd init)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-test-scaffold-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignorar errores de limpieza temporal
    }
  });

  it('should scaffold a Greenfield project with full skills and templates', async () => {
    const result = await scaffoldProject({
      projectRoot: tempDir,
      projectName: 'test-greenfield',
      mode: 'greenfield',
      severity: 'L2',
      bridges: ['cursor', 'claude', 'antigravity'],
      includeSkills: true,
    });

    expect(result.mode).toBe('greenfield');
    expect(result.severity).toBe('L2');

    // Comprobar directorios y plantillas
    expect(await fileExists(path.join(tempDir, '.sdd', 'templates', 'spec.template.md'))).toBe(true);
    expect(await fileExists(path.join(tempDir, '.sdd', 'templates', 'plan.template.md'))).toBe(true);
    expect(await fileExists(path.join(tempDir, '.sdd', 'templates', 'tasks.template.md'))).toBe(true);
    expect(await fileExists(path.join(tempDir, '.sdd', 'templates', 'ears-guide.md'))).toBe(true);

    // Comprobar configuración
    expect(await fileExists(path.join(tempDir, '.sdd', 'config.json'))).toBe(true);

    // Comprobar constitución
    const agentsMd = path.join(tempDir, 'AGENTS.md');
    expect(await fileExists(agentsMd)).toBe(true);
    const constitution = await readFileUtf8(agentsMd);
    expect(constitution).toContain('Constitución del Proyecto: test-greenfield');
    expect(constitution).toContain('Prohibición de Complacencia Artificial');
    expect(constitution).toContain('Auto-Grill Mandatorio de la IA');

    // Comprobar skills
    expect(await fileExists(path.join(tempDir, '.agents', 'skills', 'grill-me', 'SKILL.md'))).toBe(true);
    expect(await fileExists(path.join(tempDir, '.agents', 'skills', 'clean-code', 'SKILL.md'))).toBe(true);
    expect(await fileExists(path.join(tempDir, '.agents', 'skills', 'project-graph', 'SKILL.md'))).toBe(true);
    expect(await fileExists(path.join(tempDir, '.agents', 'skills', 'graphify', 'SKILL.md'))).toBe(true);
    expect(await fileExists(path.join(tempDir, '.agents', 'skills', 'sdd-methodology', 'SKILL.md'))).toBe(true);

    // Comprobar puentes
    expect(await fileExists(path.join(tempDir, '.cursorrules'))).toBe(true);
    expect(await fileExists(path.join(tempDir, 'CLAUDE.md'))).toBe(true);
  });

  it('should scaffold a Brownfield project creating baseline spec and reverse constitution', async () => {
    // Simular archivo existente de proyecto
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({
        name: 'legacy-app',
        scripts: { test: 'vitest run' },
        devDependencies: { vitest: '^2.0.0', typescript: '^5.0.0' },
      })
    );

    const result = await scaffoldProject({
      projectRoot: tempDir,
      mode: 'brownfield',
      severity: 'L3',
      bridges: ['cursor'],
      includeSkills: false,
    });

    expect(result.mode).toBe('brownfield');
    expect(result.severity).toBe('L3');

    // Comprobar línea base SPEC-000
    const baselinePath = path.join(tempDir, '.sdd', 'specs', 'SPEC-000-BASELINE.md');
    expect(await fileExists(baselinePath)).toBe(true);
    const baselineContent = await readFileUtf8(baselinePath);
    expect(baselineContent).toContain('SPEC-000: Línea Base del Sistema');

    // Comprobar que no instaló skills porque includeSkills fue false
    expect(await fileExists(path.join(tempDir, '.agents', 'skills'))).toBe(false);
  });

  it('should keep an existing config.json and edited templates when init runs again', async () => {
    const sddDir = path.join(tempDir, '.sdd');
    const editedTemplate = '# Plantilla del equipo\n\nNo sobrescribir.\n';
    await fs.mkdir(path.join(sddDir, 'templates'), { recursive: true });
    await fs.writeFile(
      path.join(sddDir, 'config.json'),
      JSON.stringify({ severity: 'L1', autonomous: { maxRetries: 5 }, custom: 'del equipo' })
    );
    await fs.writeFile(path.join(sddDir, 'templates', 'spec.template.md'), editedTemplate);

    const result = await scaffoldProject({ projectRoot: tempDir, mode: 'greenfield', includeSkills: false });

    const config = JSON.parse(await readFileUtf8(path.join(sddDir, 'config.json')));
    expect(config.severity).toBe('L1');
    expect(config.autonomous.maxRetries).toBe(5);
    expect(config.autonomous.branchPrefix).toBe('sdd/');
    expect(config.custom).toBe('del equipo');
    expect(result.severity).toBe('L1');
    expect(await readFileUtf8(path.join(sddDir, 'templates', 'spec.template.md'))).toBe(editedTemplate);
    expect(await fileExists(path.join(sddDir, 'templates', 'plan.template.md'))).toBe(true);
  });

  it('should let an explicit severity replace the existing one', async () => {
    await fs.mkdir(path.join(tempDir, '.sdd'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.sdd', 'config.json'),
      JSON.stringify({ severity: 'L1', autonomous: { maxRetries: 5 } })
    );

    await scaffoldProject({ projectRoot: tempDir, mode: 'greenfield', severity: 'L3', includeSkills: false });

    const config = JSON.parse(await readFileUtf8(path.join(tempDir, '.sdd', 'config.json')));
    expect(config.severity).toBe('L3');
    expect(config.autonomous.maxRetries).toBe(5);
  });

  it('should refuse to overwrite a config.json that is not valid JSON', async () => {
    const broken = '{ "severity": "L1", ';
    await fs.mkdir(path.join(tempDir, '.sdd'), { recursive: true });
    await fs.writeFile(path.join(tempDir, '.sdd', 'config.json'), broken);

    await expect(
      scaffoldProject({ projectRoot: tempDir, mode: 'greenfield', includeSkills: false })
    ).rejects.toThrow(/config\.json/);
    expect(await readFileUtf8(path.join(tempDir, '.sdd', 'config.json'))).toBe(broken);
  });

  it('should persist chosen graphEngine in config.json and return it in result', async () => {
    const result = await scaffoldProject({
      projectRoot: tempDir,
      mode: 'greenfield',
      severity: 'L2',
      bridges: ['cursor'],
      includeSkills: true,
      graphEngine: 'graphify',
    });

    expect(result.graphEngine).toBe('graphify');

    const configRaw = await readFileUtf8(path.join(tempDir, '.sdd', 'config.json'));
    const config = JSON.parse(configRaw);
    expect(config.graph.engine).toBe('graphify');
  });
});

describe('Scaffold Module (planScaffold and the constitution file)', () => {
  let root: string;
  const TEAM_AGENTS = Buffer.from('# AGENTS.md del equipo (espejo para Codex)\n\nReglas propias.\n', 'utf-8');
  const TEAM_CLAUDE = Buffer.from('# CLAUDE.md del equipo\n\nFuente de verdad del equipo.\n', 'utf-8');

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-test-plan-scaffold-'));
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  async function hashDirectory(): Promise<Record<string, string>> {
    const hashes: Record<string, string> = {};
    for (const file of await listFilesRecursive(root)) {
      hashes[path.relative(root, file)] = createHash('sha256').update(await fs.readFile(file)).digest('hex');
    }
    return hashes;
  }

  const options = () => ({ projectRoot: root, projectName: 'equipo', mode: 'greenfield' as const, bridges: ['claude' as const], includeSkills: false });

  it('should write the constitution to .sdd/constitution.md and keep the team AGENTS.md and CLAUDE.md', async () => {
    await fs.writeFile(path.join(root, 'AGENTS.md'), TEAM_AGENTS);
    await fs.writeFile(path.join(root, 'CLAUDE.md'), TEAM_CLAUDE);

    await scaffoldProject(options());

    expect(await readFileUtf8(path.join(root, '.sdd', 'constitution.md'))).toContain('Constitución del Proyecto: equipo');
    for (const [file, original] of [['AGENTS.md', TEAM_AGENTS], ['CLAUDE.md', TEAM_CLAUDE]] as const) {
      const raw = await fs.readFile(path.join(root, file));
      expect(Buffer.compare(raw.subarray(0, original.length), original)).toBe(0);
      expect(raw.toString('utf-8').split(BLOCK_BEGIN)).toHaveLength(2);
    }
    expect(await readFileUtf8(path.join(root, 'CLAUDE.md'))).toContain('@.sdd/constitution.md');
  });

  it('should not modify the constitution nor create backups on a second init', async () => {
    await fs.writeFile(path.join(root, 'AGENTS.md'), TEAM_AGENTS);
    await scaffoldProject(options());
    const constitution = await fs.readFile(path.join(root, '.sdd', 'constitution.md'));

    const second = await scaffoldProject(options());

    expect(Buffer.compare(await fs.readFile(path.join(root, '.sdd', 'constitution.md')), constitution)).toBe(0);
    expect(second.modifiedFiles).toEqual([]);
    expect(second.backups).toEqual([]);
  });

  it('should plan without writing and list every file with the diff of its modifications', async () => {
    await fs.writeFile(path.join(root, 'CLAUDE.md'), TEAM_CLAUDE);
    const before = await hashDirectory();

    const plan = await planScaffold(options());
    const output = renderFilePlan(plan);

    expect(await hashDirectory()).toEqual(before);
    expect(output).toContain('.sdd/constitution.md');
    expect(output).toContain('.sdd/config.json');
    expect(output).toContain('--- a/CLAUDE.md');
    expect(output).toContain('+@.sdd/constitution.md');
  });

  it('should not back up anything when initialising an empty project', async () => {
    const result = await scaffoldProject(options());

    expect(result.backups).toEqual([]);
    expect(await fileExists(path.join(root, '.sdd', 'specs'))).toBe(true);
    expect((await readFileUtf8(path.join(root, 'AGENTS.md'))).startsWith(BLOCK_BEGIN)).toBe(true);
  });

  it('should migrate a 1.x constitution instead of generating a new one', async () => {
    const legacy = Buffer.from('# Constitución del Proyecto: legacy-app\n\nReglas de la 1.x.\n', 'utf-8');
    await fs.writeFile(path.join(root, 'AGENTS.md'), legacy);

    await scaffoldProject(options());

    expect(Buffer.compare(await fs.readFile(path.join(root, '.sdd', 'constitution.md')), legacy)).toBe(0);
  });
});

describe('Scaffold Module (planReverse for sdd reverse)', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-test-plan-reverse-'));
    await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'legacy-app', devDependencies: { vitest: '^2.0.0' } }));
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('should plan the baseline, the reverse constitution and only the bridges in config.json', async () => {
    await fs.mkdir(path.join(root, '.sdd'));
    await fs.writeFile(path.join(root, '.sdd', 'config.json'), JSON.stringify({ bridges: ['claude'] }));

    const plan = await planReverse(root);
    const paths = plan.changes.map((change) => change.relPath);

    expect(paths).toContain('.sdd/specs/SPEC-000-BASELINE.md');
    expect(paths).toContain('.sdd/constitution.md');
    expect(paths).toContain('CLAUDE.md');
    expect(paths).toContain('AGENTS.md');
    expect(paths).not.toContain('.cursorrules');
    const constitution = plan.changes.find((change) => change.relPath === '.sdd/constitution.md');
    expect(constitution?.kind === 'create' && constitution.after.toString('utf-8')).toContain('Ingeniería Inversa');
  });

  it('should keep an existing constitution and baseline', async () => {
    await fs.mkdir(path.join(root, '.sdd', 'specs'), { recursive: true });
    await fs.writeFile(path.join(root, '.sdd', 'constitution.md'), '# Constitución del equipo\n');
    await fs.writeFile(path.join(root, '.sdd', 'specs', 'SPEC-000-BASELINE.md'), '# Línea base editada\n');

    const paths = (await planReverse(root)).changes.map((change) => change.relPath);

    expect(paths).not.toContain('.sdd/constitution.md');
    expect(paths).not.toContain('.sdd/specs/SPEC-000-BASELINE.md');
  });
});
