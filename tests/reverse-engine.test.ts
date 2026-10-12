import { describe, it, expect } from 'vitest';
import { scanProject, generateReverseConstitution, generateReverseBaselineSpec } from '../src/core/reverse-engine.js';
import path from 'node:path';

describe('Reverse Engine (Brownfield)', () => {
  it('should scan current repository and identify Node ecosystem', async () => {
    const scan = await scanProject(process.cwd());
    expect(scan.ecosystem).toBe('node');
    expect(scan.detectedLanguages).toContain('TypeScript');
    expect(scan.devDependencies).toContain('vitest');
  });

  it('should generate reverse constitution containing observed stack', async () => {
    const scan = await scanProject(process.cwd());
    const constitution = generateReverseConstitution(scan);
    expect(constitution).toContain('Constitución del Proyecto');
    expect(constitution).toContain('NODE');
    expect(constitution).toContain('Preservación del Código Existente');
  });

  it('should generate valid baseline spec in EARS format', async () => {
    const scan = await scanProject(process.cwd());
    const spec = generateReverseBaselineSpec(scan);
    expect(spec).toContain('SPEC-000: Línea Base');
    expect(spec).toContain('REQ-000-01');
    expect(spec).toContain('MIENTRAS');
  });
});
