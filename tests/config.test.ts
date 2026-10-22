import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { DEFAULT_CONFIG, loadConfig, mergeConfig, SddConfig } from '../src/core/config.js';

describe('Config Module', () => {
  it('should return default config when no config.json exists', async () => {
    const config = await loadConfig('non-existent-dir');
    expect(config.version).toBe('1.0.0');
    expect(config.severity).toBe('L2');
    expect(config.locale).toBe('en');
    expect(config.autonomous.maxRetries).toBe(3);
  });

  it('should have all 3 severity levels supported', () => {
    const levels: SddConfig['severity'][] = ['L1', 'L2', 'L3'];
    expect(levels).toHaveLength(3);
  });

  it('should fill nested defaults when loading a partial config.json', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-test-config-'));
    try {
      await fs.mkdir(path.join(root, '.sdd'));
      await fs.writeFile(path.join(root, '.sdd', 'config.json'), '﻿{"autonomous":{"maxRetries":5}}');

      const config = await loadConfig(root);

      expect(config.autonomous).toEqual({ ...DEFAULT_CONFIG.autonomous, maxRetries: 5 });
      expect(config.projectName).toBe(path.basename(root));
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});

describe('Config Module (mergeConfig: default < existing < explicit)', () => {
  it('should return the defaults when there is nothing to merge', () => {
    expect(mergeConfig(null, {})).toEqual(DEFAULT_CONFIG);
  });

  it('should keep existing values and add the missing nested keys', () => {
    const merged = mergeConfig({ severity: 'L1', autonomous: { maxRetries: 5 } } as never, {});

    expect(merged.severity).toBe('L1');
    expect(merged.autonomous.maxRetries).toBe(5);
    expect(merged.autonomous.branchPrefix).toBe(DEFAULT_CONFIG.autonomous.branchPrefix);
    expect(merged.graph).toEqual(DEFAULT_CONFIG.graph);
  });

  it('should let explicit values win and ignore the ones left undefined', () => {
    const existing = { severity: 'L1', locale: 'es' } as never;

    const merged = mergeConfig(existing, { severity: 'L3', locale: undefined });

    expect(merged.severity).toBe('L3');
    expect(merged.locale).toBe('es');
  });

  it('should replace arrays instead of concatenating them', () => {
    const merged = mergeConfig({ bridges: ['cursor'] } as never, { bridges: ['claude'] });

    expect(merged.bridges).toEqual(['claude']);
  });

  it('should preserve keys the team added and never mutate the defaults', () => {
    const snapshot = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

    const merged = mergeConfig({ custom: { owner: 'equipo' } } as never, { graph: { engine: 'graphify' } });

    expect((merged as unknown as { custom: unknown }).custom).toEqual({ owner: 'equipo' });
    expect(merged.graph.engine).toBe('graphify');
    expect(DEFAULT_CONFIG).toEqual(snapshot);
  });
});
