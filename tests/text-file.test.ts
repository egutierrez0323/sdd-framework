import { describe, it, expect } from 'vitest';
import {
  decodeText,
  encodeText,
  detectEol,
  toEol,
  InvalidEncodingError,
} from '../src/utils/text-file.js';

const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

describe('Text File Module (BOM, EOL and UTF-8 preservation)', () => {
  it('should round-trip a file with BOM and CRLF byte for byte', () => {
    const raw = Buffer.concat([BOM, Buffer.from('# Reglas del equipo\r\nLínea con acentos: ñ, é\r\n', 'utf-8')]);

    const content = decodeText(raw, 'CLAUDE.md');

    expect(content.hasBom).toBe(true);
    expect(content.eol).toBe('\r\n');
    expect(content.text.startsWith('﻿')).toBe(false);
    expect(Buffer.compare(encodeText(content), raw)).toBe(0);
  });

  it('should round-trip a file with LF and no BOM byte for byte', () => {
    const raw = Buffer.from('linea 1\nlinea 2\n', 'utf-8');

    const content = decodeText(raw, 'AGENTS.md');

    expect(content.hasBom).toBe(false);
    expect(content.eol).toBe('\n');
    expect(Buffer.compare(encodeText(content), raw)).toBe(0);
  });

  it('should round-trip an empty file and a BOM-only file', () => {
    const empty = decodeText(Buffer.alloc(0), 'vacio.md');
    expect(empty).toEqual({ text: '', hasBom: false, eol: '\n' });
    expect(encodeText(empty).length).toBe(0);

    const bomOnly = decodeText(BOM, 'solo-bom.md');
    expect(bomOnly.hasBom).toBe(true);
    expect(bomOnly.text).toBe('');
    expect(Buffer.compare(encodeText(bomOnly), BOM)).toBe(0);
  });

  it('should keep a second BOM as part of the text instead of dropping it', () => {
    const raw = Buffer.concat([BOM, BOM, Buffer.from('x\n', 'utf-8')]);

    const content = decodeText(raw, 'doble-bom.md');

    expect(content.text.startsWith('﻿')).toBe(true);
    expect(Buffer.compare(encodeText(content), raw)).toBe(0);
  });

  it('should detect the end of line from the first line break', () => {
    expect(detectEol('a\r\nb\nc')).toBe('\r\n');
    expect(detectEol('a\nb\r\nc')).toBe('\n');
    expect(detectEol('sin saltos')).toBe('\n');
    expect(detectEol('\r\nempieza con CRLF')).toBe('\r\n');
  });

  it('should reject Windows-1252 bytes with InvalidEncodingError carrying the path', () => {
    const cp1252 = Buffer.from([0x52, 0x65, 0x67, 0x6c, 0x61, 0x73, 0x20, 0xe9, 0xf1, 0x0d, 0x0a]);

    expect(() => decodeText(cp1252, 'legacy/CLAUDE.md')).toThrow(InvalidEncodingError);
    try {
      decodeText(cp1252, 'legacy/CLAUDE.md');
    } catch (err) {
      expect((err as InvalidEncodingError).filePath).toBe('legacy/CLAUDE.md');
      expect((err as Error).message).toContain('legacy/CLAUDE.md');
    }
  });

  it('should convert generated text to the requested end of line', () => {
    expect(toEol('a\nb\r\nc\n', '\r\n')).toBe('a\r\nb\r\nc\r\n');
    expect(toEol('a\r\nb\nc', '\n')).toBe('a\nb\nc');
  });
});
