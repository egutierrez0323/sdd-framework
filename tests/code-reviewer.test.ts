import { describe, it, expect } from 'vitest';
import {
  findDuplicateBlocks,
  analyzeFunctionMetrics,
  reviewProject,
  formatReviewReport,
} from '../src/core/code-reviewer.js';

describe('Code Reviewer Module (Clean Code & DRY Engine)', () => {
  it('should detect duplicate blocks across files with minLines threshold', () => {
    const file1 = `
export function doAlpha() {
  const a = 10;
  const b = 20;
  const c = 30;
  const d = 40;
  const e = 50;
  return a + b + c + d + e;
}
    `.trim();

    const file2 = `
export function doBeta() {
  const a = 10;
  const b = 20;
  const c = 30;
  const d = 40;
  const e = 50;
  return a + b + c + d + e;
}
    `.trim();

    const duplicates = findDuplicateBlocks(
      [
        { path: 'src/file1.ts', content: file1 },
        { path: 'src/file2.ts', content: file2 },
      ],
      5
    );

    expect(duplicates.length).toBeGreaterThan(0);
    expect(duplicates[0].sourceFile).toBe('src/file1.ts');
    expect(duplicates[0].targetFile).toBe('src/file2.ts');
    expect(duplicates[0].lineCount).toBe(5);
  });

  it('should not detect false duplicates when lines are different', () => {
    const file1 = `
export function funcA() {
  const x = 1;
  const y = 2;
  return x + y;
}
    `.trim();

    const file2 = `
export function funcB() {
  const name = 'Antigravity';
  const role = 'Architect';
  return name + role;
}
    `.trim();

    const duplicates = findDuplicateBlocks(
      [
        { path: 'src/a.ts', content: file1 },
        { path: 'src/b.ts', content: file2 },
      ],
      5
    );

    expect(duplicates.length).toBe(0);
  });

  it('should analyze function metrics and flag long functions or excess params', () => {
    const code = `
export function shortFunc(a: number, b: number) {
  return a + b;
}

export function longMonolithicFunc(p1: number, p2: number, p3: number, p4: number, p5: number) {
  const line1 = 1;
  const line2 = 2;
  const line3 = 3;
  const line4 = 4;
  const line5 = 5;
  const line6 = 6;
  const line7 = 7;
  const line8 = 8;
  const line9 = 9;
  const line10 = 10;
  return line1 + line2 + line3 + line4 + line5 + line6 + line7 + line8 + line9 + line10;
}
    `.trim();

    const metrics = analyzeFunctionMetrics('src/sample.ts', code, 10, 4);

    expect(metrics.length).toBe(2);

    const shortF = metrics.find((m) => m.name === 'shortFunc');
    expect(shortF).toBeDefined();
    expect(shortF?.isOverLimit).toBe(false);

    const longF = metrics.find((m) => m.name === 'longMonolithicFunc');
    expect(longF).toBeDefined();
    expect(longF?.isOverLimit).toBe(true);
    expect(longF?.paramCount).toBe(5);
  });

  it('should perform review on project directory and return formatted report', async () => {
    const report = await reviewProject('src', process.cwd());

    expect(report.filesScanned).toBeGreaterThan(0);
    expect(report.qualityScore).toBeGreaterThanOrEqual(0);
    expect(report.qualityScore).toBeLessThanOrEqual(100);
    expect(['EXCELLENT', 'GOOD', 'NEEDS_REFACTOR', 'CRITICAL']).toContain(
      report.summary.cleanCodeStatus
    );

    const formatted = formatReviewReport(report);
    expect(formatted).toContain('AUDITOR DE CÓDIGO LIMPIO Y DRY (SDD REVIEW)');
    expect(formatted).toContain('Puntuación de salud:');
  });
});
