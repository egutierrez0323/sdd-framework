import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { scaffoldProject } from '../src/core/scaffold.js';
import { fileExists, readFileUtf8 } from '../src/utils/fs-helpers.js';

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
});
