import { describe, it, expect } from 'vitest';
import { unifiedDiff } from '../src/utils/line-diff.js';

const BEGIN = '<!-- SDD:BEGIN -->';
const END = '<!-- SDD:END -->';

function hunkLines(diff: string): string[] {
  return diff.split('\n').slice(3).filter((line) => line.length > 0);
}

describe('Line Diff Module (unified diff for --dry-run)', () => {
  it('should show an appended block as additions only, with 3 lines of context', () => {
    const before = 'l1\nl2\nl3\nl4\nl5\n';
    const after = `${before}\n${BEGIN}\n@.sdd/constitution.md\n${END}\n`;

    const diff = unifiedDiff('CLAUDE.md', before, after);

    expect(diff.split('\n').slice(0, 3)).toEqual(['--- a/CLAUDE.md', '+++ b/CLAUDE.md', '@@ -3,3 +3,7 @@']);
    expect(hunkLines(diff)).toEqual([' l3', ' l4', ' l5', '+', `+${BEGIN}`, '+@.sdd/constitution.md', `+${END}`]);
    expect(hunkLines(diff).some((line) => line.startsWith('-'))).toBe(false);
  });

  it('should show a replaced block as removals and additions of that region only', () => {
    const before = `# Reglas\nx\n${BEGIN}\nconstitución vieja\n${END}\ny\nz\n`;
    const after = `# Reglas\nx\n${BEGIN}\nconstitución nueva\n${END}\ny\nz\n`;

    const diff = unifiedDiff('AGENTS.md', before, after);

    expect(diff.split('\n')[2]).toBe('@@ -1,7 +1,7 @@');
    expect(hunkLines(diff)).toEqual([
      ' # Reglas',
      ' x',
      ` ${BEGIN}`,
      '-constitución vieja',
      '+constitución nueva',
      ` ${END}`,
      ' y',
      ' z',
    ]);
  });

  it('should return an empty diff for identical texts', () => {
    expect(unifiedDiff('CLAUDE.md', 'a\nb\n', 'a\nb\n')).toBe('');
  });

  it('should describe a new file as additions from an empty range', () => {
    const diff = unifiedDiff('.sdd/constitution.md', '', 'a\nb\n');

    expect(diff.split('\n')[2]).toBe('@@ -0,0 +1,2 @@');
    expect(hunkLines(diff)).toEqual(['+a', '+b']);
  });

  it('should hide carriage returns and lines farther than the context window', () => {
    const lines = Array.from({ length: 10 }, (_, i) => `línea ${i + 1}`);
    const before = `${lines.join('\r\n')}\r\n`;
    const after = before.replace('línea 6', 'línea seis');

    const diff = unifiedDiff('CLAUDE.md', before, after);

    expect(diff).not.toContain('\r');
    expect(diff.split('\n')[2]).toBe('@@ -3,7 +3,7 @@');
    expect(hunkLines(diff)[0]).toBe(' línea 3');
    expect(hunkLines(diff).at(-1)).toBe(' línea 9');
  });
});
