import { TextDecoder } from 'node:util';

const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

export type Eol = '\r\n' | '\n';

export interface TextContent {
  text: string;
  hasBom: boolean;
  eol: Eol;
}

export class InvalidEncodingError extends Error {
  constructor(readonly filePath: string) {
    super(`El archivo no es UTF-8 válido y no se modificará: ${filePath}`);
    this.name = 'InvalidEncodingError';
  }
}

/**
 * Decodifica un archivo de texto conservando su BOM y su fin de línea.
 * Rechaza los bytes que no son UTF-8 válido para no alterar archivos en otra codificación.
 */
export function decodeText(raw: Buffer, filePath: string): TextContent {
  const hasBom = raw.subarray(0, UTF8_BOM.length).equals(UTF8_BOM);
  const body = hasBom ? raw.subarray(UTF8_BOM.length) : raw;

  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(body);
  } catch {
    throw new InvalidEncodingError(filePath);
  }

  return { text, hasBom, eol: detectEol(text) };
}

export function encodeText(content: TextContent): Buffer {
  const body = Buffer.from(content.text, 'utf-8');
  return content.hasBom ? Buffer.concat([UTF8_BOM, body]) : body;
}

export function detectEol(text: string): Eol {
  const firstBreak = text.indexOf('\n');
  return firstBreak > 0 && text[firstBreak - 1] === '\r' ? '\r\n' : '\n';
}

/**
 * Ajusta al fin de línea del archivo destino el texto que genera SDD (nunca el del usuario).
 */
export function toEol(text: string, eol: Eol): string {
  return text.replace(/\r?\n/g, eol);
}
