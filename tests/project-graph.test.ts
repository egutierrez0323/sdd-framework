import { describe, it, expect } from 'vitest';
import { generateProjectGraph, formatMermaidGraph, saveProjectGraphArtifacts } from '../src/core/project-graph.js';
import { fileExists, readFileUtf8 } from '../src/utils/fs-helpers.js';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

describe('Project Graph Module (Token Optimization)', () => {
  it('should generate graph with nodes and calculate token reduction', async () => {
    const graph = await generateProjectGraph(process.cwd());
    expect(graph.nodes.length).toBeGreaterThan(5);
    expect(graph.stats.totalExports).toBeGreaterThan(0);
    expect(graph.stats.tokenReductionPercent).toBeGreaterThan(50);
  });

  it('should format mermaid markdown and compact semantic index', async () => {
    const graph = await generateProjectGraph(process.cwd());
    const md = formatMermaidGraph(graph);

    expect(md).toContain('graph TD');
    expect(md).toContain('Índice Semántico Ultracompacto');
    expect(md).toContain('Ahorro de Tokens:');
  });

  it('should persist context-graph.json and architecture-graph.md', async () => {
    // Lee el código de este repositorio, pero escribe los artefactos en una carpeta temporal.
    const graph = await generateProjectGraph(process.cwd());
    const outputRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-test-graph-'));

    try {
      const { jsonPath, mermaidPath } = await saveProjectGraphArtifacts(graph, outputRoot);

      expect(jsonPath).toBe(path.join(outputRoot, '.sdd', 'context-graph.json'));
      expect(await fileExists(jsonPath)).toBe(true);
      expect(await fileExists(mermaidPath)).toBe(true);

      const content = await readFileUtf8(mermaidPath);
      expect(content).toContain('Mapa Visual de Arquitectura');
    } finally {
      await fs.rm(outputRoot, { recursive: true, force: true });
    }
  });
});
