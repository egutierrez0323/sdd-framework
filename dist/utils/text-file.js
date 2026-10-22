import { TextDecoder } from 'node:util';
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);
export class InvalidEncodingError extends Error {
    filePath;
    constructor(filePath) {
        super(`El archivo no es UTF-8 válido y no se modificará: ${filePath}`);
        this.filePath = filePath;
        this.name = 'InvalidEncodingError';
    }
}
/**
 * Decodifica un archivo de texto conservando su BOM y su fin de línea.
 * Rechaza los bytes que no son UTF-8 válido para no alterar archivos en otra codificación.
 */
export function decodeText(raw, filePath) {
    const hasBom = raw.subarray(0, UTF8_BOM.length).equals(UTF8_BOM);
    const body = hasBom ? raw.subarray(UTF8_BOM.length) : raw;
    let text;
    try {
        text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(body);
    }
    catch {
        throw new InvalidEncodingError(filePath);
    }
    return { text, hasBom, eol: detectEol(text) };
}
export function encodeText(content) {
    const body = Buffer.from(content.text, 'utf-8');
    return content.hasBom ? Buffer.concat([UTF8_BOM, body]) : body;
}
export function detectEol(text) {
    const firstBreak = text.indexOf('\n');
    return firstBreak > 0 && text[firstBreak - 1] === '\r' ? '\r\n' : '\n';
}
/**
 * Ajusta al fin de línea del archivo destino el texto que genera SDD (nunca el del usuario).
 */
export function toEol(text, eol) {
    return text.replace(/\r?\n/g, eol);
}
//# sourceMappingURL=text-file.js.map