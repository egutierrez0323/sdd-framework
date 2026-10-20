import { describe, it, expect } from 'vitest';
import { syncBridges } from '../src/core/bridges.js';
import { fileExists, readFileUtf8 } from '../src/utils/fs-helpers.js';
import path from 'node:path';

describe('Bridges Synchronization Module', () => {
  it('should sync AGENTS.md to .cursorrules, CLAUDE.md, copilot and antigravity', async () => {
    const report = await syncBridges(process.cwd(), ['cursor', 'claude', 'copilot', 'antigravity']);
    expect(report.synced).toContain('cursor');
    expect(report.synced).toContain('claude');
    expect(report.synced).toContain('copilot');
    expect(report.synced).toContain('antigravity');

    const cursorRulesExists = await fileExists(path.join(process.cwd(), '.cursorrules'));
    const claudeMdExists = await fileExists(path.join(process.cwd(), 'CLAUDE.md'));
    const copilotExists = await fileExists(path.join(process.cwd(), '.github', 'copilot-instructions.md'));
    const agRulesExists = await fileExists(path.join(process.cwd(), '.agents', 'rules', 'sdd-rules.md'));

    expect(cursorRulesExists).toBe(true);
    expect(claudeMdExists).toBe(true);
    expect(copilotExists).toBe(true);
    expect(agRulesExists).toBe(true);

    const claudeContent = await readFileUtf8(path.join(process.cwd(), 'CLAUDE.md'));
    expect(claudeContent).toContain('Constitution');
  });
});
