import { describe, it, expect, afterAll, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import { generateDashboardHtml } from '../src/core/ui-html.js';
import path from 'node:path';
import http from 'node:http';
import {
  findAvailablePort,
  collectSddProjectData,
  startUiServer,
} from '../src/core/ui-server.js';

describe('UI Server & Dashboard Module', () => {
  let activeServer: http.Server | undefined;

  afterAll(async () => {
    if (activeServer) {
      await new Promise<void>((resolve) => activeServer!.close(() => resolve()));
    }
  });

  it('should find an available port starting from 3333', async () => {
    const port = await findAvailablePort(3333);
    expect(port).toBeGreaterThanOrEqual(3333);
    expect(typeof port).toBe('number');
  });

  it('should collect project data from card-validator test project', async () => {
    const cardValidatorDir = path.join(process.cwd(), 'card-validator');
    const data = await collectSddProjectData(cardValidatorDir);

    expect(data.projectName).toBeDefined();
    expect(data.locale).toBeDefined();
    expect(['en', 'es']).toContain(data.locale);
    expect(data.specs.length).toBeGreaterThan(0);
    expect(data.specs.some((s) => s.id === 'SPEC-CARD-VALIDATION')).toBe(true);

    const cardSpec = data.specs.find((s) => s.id === 'SPEC-CARD-VALIDATION')!;
    expect(cardSpec.status).toBe('APPROVED');
    expect(cardSpec.requirementsCount).toBeGreaterThan(0);

    // Comprobar estadísticas
    expect(data.stats.totalSpecs).toBe(data.specs.length);
    expect(data.stats.totalRequirements).toBeGreaterThan(0);
    expect(data.stats.earsBreakdown.Ubiquitous).toBeGreaterThan(0);

    // Comprobar tareas
    expect(data.tasks.length).toBeGreaterThan(0);
    const cardTasks = data.tasks.find((t) => t.id === 'TASKS-CARD-VALIDATION')!;
    expect(cardTasks.completedTasks).toBeGreaterThan(0);
    expect(cardTasks.progressPercent).toBeGreaterThan(0);
  });

  it('should start UI server and serve HTML dashboard and /api/data JSON', async () => {
    const cardValidatorDir = path.join(process.cwd(), 'card-validator');
    const { server, url, port } = await startUiServer({
      projectRoot: cardValidatorDir,
      openBrowser: false,
    });
    activeServer = server;

    expect(url).toContain(`http://localhost:${port}`);

    // Probar GET /
    const htmlRes = await fetch(url);
    expect(htmlRes.status).toBe(200);
    const html = await htmlRes.text();
    expect(html).toContain('SDD Visualizer & Dashboard');
    expect(html).toContain('Spec-Driven Development');

    // Probar GET /api/data
    const apiRes = await fetch(`${url}/api/data`);
    expect(apiRes.status).toBe(200);
    const data = await apiRes.json();
    expect(data.specs).toBeDefined();
    expect(data.stats).toBeDefined();
    expect(data.stats.totalSpecs).toBeGreaterThan(0);
  });
});

describe('UI Server (constitution source for the dashboard)', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-test-ui-constitution-'));
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('should read .sdd/constitution.md even when the team has its own AGENTS.md', async () => {
    await fs.mkdir(path.join(root, '.sdd'));
    await fs.writeFile(path.join(root, '.sdd', 'constitution.md'), '# Constitución SDD\n');
    await fs.writeFile(path.join(root, 'AGENTS.md'), '# AGENTS.md del equipo (espejo para Codex)\n');

    const data = await collectSddProjectData(root);

    expect(data.constitution).toBe('# Constitución SDD\n');
    expect(data.constitutionPath).toBe('.sdd/constitution.md');
  });

  it('should fall back to AGENTS.md in a project that has not been migrated', async () => {
    await fs.writeFile(path.join(root, 'AGENTS.md'), '# Constitución del Proyecto: legacy-app\n');

    const data = await collectSddProjectData(root);

    expect(data.constitution).toBe('# Constitución del Proyecto: legacy-app\n');
    expect(data.constitutionPath).toBe('AGENTS.md');
  });

  it('should report no constitution when neither file exists', async () => {
    const data = await collectSddProjectData(root);

    expect(data.constitution).toBe('');
    expect(data.constitutionPath).toBe('');
  });

  it('should not hard-code AGENTS.md as the constitution source in the dashboard', () => {
    const html = generateDashboardHtml();

    expect(html).not.toContain('(AGENTS.md)');
    expect(html).toContain('id="constitutionSource"');
  });
});
