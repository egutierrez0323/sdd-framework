import { describe, it, expect } from 'vitest';
import {
  BLOCK_BEGIN,
  BLOCK_END,
  scanManagedBlock,
  upsertManagedBlock,
  ManagedBlockError,
} from '../src/core/managed-block.js';

const TEAM_RULES = '# Reglas del equipo\n\nNingún commit sin autorización.\n';

function expectMalformedAt(text: string, line: number): void {
  const scan = scanManagedBlock(text);
  expect(scan.kind).toBe('malformed');
  if (scan.kind === 'malformed') expect(scan.line).toBe(line);

  expect(() => upsertManagedBlock(text, 'cuerpo', '\n')).toThrow(ManagedBlockError);
  try {
    upsertManagedBlock(text, 'cuerpo', '\n');
  } catch (err) {
    expect((err as ManagedBlockError).line).toBe(line);
  }
}

describe('Managed Block Module (SDD:BEGIN / SDD:END)', () => {
  it('should append the block keeping the original text as an exact prefix', () => {
    const result = upsertManagedBlock(TEAM_RULES, '@.sdd/constitution.md', '\n');

    expect(result.startsWith(TEAM_RULES)).toBe(true);
    expect(result.slice(TEAM_RULES.length)).toBe(`\n${BLOCK_BEGIN}\n@.sdd/constitution.md\n${BLOCK_END}\n`);
  });

  it('should finish the last line before appending when the file has no trailing newline', () => {
    const original = '# Reglas sin salto final';

    const result = upsertManagedBlock(original, 'cuerpo', '\n');

    expect(result).toBe(`${original}\n\n${BLOCK_BEGIN}\ncuerpo\n${BLOCK_END}\n`);
  });

  it('should create a block-only text from an empty file', () => {
    expect(upsertManagedBlock('', 'cuerpo', '\n')).toBe(`${BLOCK_BEGIN}\ncuerpo\n${BLOCK_END}\n`);
  });

  it('should replace only the region between BEGIN and END when the block exists', () => {
    const before = '# Antes del bloque\n\n';
    const after = '\n\n## Después del bloque\nTexto del equipo.\n';
    const original = `${before}${BLOCK_BEGIN}\nconstitución vieja\n${BLOCK_END}${after}`;

    const result = upsertManagedBlock(original, 'constitución nueva', '\n');

    expect(result).toBe(`${before}${BLOCK_BEGIN}\nconstitución nueva\n${BLOCK_END}${after}`);
  });

  it('should be idempotent when applied twice', () => {
    const once = upsertManagedBlock(TEAM_RULES, 'cuerpo', '\n');

    expect(upsertManagedBlock(once, 'cuerpo', '\n')).toBe(once);
  });

  it('should write the block with CRLF in a CRLF file without leaving bare LF', () => {
    const original = '# Reglas\r\nLínea 2\r\n';

    const result = upsertManagedBlock(original, 'línea A\nlínea B', '\r\n');

    expect(result.startsWith(original)).toBe(true);
    expect(/(?<!\r)\n/.test(result)).toBe(false);
    expect(result).toContain(`${BLOCK_BEGIN}\r\nlínea A\r\nlínea B\r\n${BLOCK_END}\r\n`);
  });

  it('should recognise indented markers and ignore markers quoted inside a sentence', () => {
    const indented = `texto\n  ${BLOCK_BEGIN}\nx\n  ${BLOCK_END}\n`;
    expect(scanManagedBlock(indented).kind).toBe('present');

    const quoted = `SDD gestiona el bloque \`${BLOCK_BEGIN}\` … \`${BLOCK_END}\`.\n`;
    expect(scanManagedBlock(quoted)).toEqual({ kind: 'absent' });
  });

  it('should report BEGIN without END at the BEGIN line', () => {
    expectMalformedAt(`línea 1\n${BLOCK_BEGIN}\nsin cierre\n`, 2);
  });

  it('should report END before BEGIN at the END line', () => {
    expectMalformedAt(`línea 1\nlínea 2\n${BLOCK_END}\n${BLOCK_BEGIN}\n`, 3);
  });

  it('should report a second block at its BEGIN line', () => {
    const twoBlocks = `${BLOCK_BEGIN}\na\n${BLOCK_END}\ntexto\n${BLOCK_BEGIN}\nb\n${BLOCK_END}\n`;

    expectMalformedAt(twoBlocks, 5);
  });

  it('should refuse a body that contains a block marker', () => {
    expect(() => upsertManagedBlock(TEAM_RULES, `ejemplo\n${BLOCK_END}\n`, '\n')).toThrow(ManagedBlockError);
  });
});
