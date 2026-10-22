import { toEol } from '../utils/text-file.js';
export const BLOCK_BEGIN = '<!-- SDD:BEGIN -->';
export const BLOCK_END = '<!-- SDD:END -->';
export class ManagedBlockError extends Error {
    line;
    reason;
    constructor(line, reason) {
        super(`Bloque SDD mal formado en la línea ${line}: ${reason}`);
        this.line = line;
        this.reason = reason;
        this.name = 'ManagedBlockError';
    }
}
/**
 * Localiza los marcadores que ocupan una línea completa (se ignoran los citados dentro de una frase).
 * `start` es el inicio de la línea y `end` el final del marcador, sin el salto de línea.
 */
function findMarkers(text) {
    const hits = [];
    let offset = 0;
    text.split('\n').forEach((rawLine, index) => {
        const content = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
        const trimmed = content.trim();
        if (trimmed === BLOCK_BEGIN || trimmed === BLOCK_END) {
            const kind = trimmed === BLOCK_BEGIN ? 'begin' : 'end';
            hits.push({ kind, line: index + 1, start: offset, end: offset + content.length });
        }
        offset += rawLine.length + 1;
    });
    return hits;
}
const ORPHAN_END = `${BLOCK_END} sin ${BLOCK_BEGIN} previo`;
function malformed(line, reason) {
    return { kind: 'malformed', line, reason };
}
export function scanManagedBlock(text) {
    const [first, second, third] = findMarkers(text);
    if (!first)
        return { kind: 'absent' };
    if (first.kind === 'end')
        return malformed(first.line, ORPHAN_END);
    if (!second)
        return malformed(first.line, `${BLOCK_BEGIN} sin ${BLOCK_END}`);
    if (second.kind === 'begin')
        return malformed(second.line, `${BLOCK_BEGIN} repetido antes de cerrar el bloque`);
    if (third)
        return malformed(third.line, third.kind === 'begin' ? 'hay más de un bloque SDD' : ORPHAN_END);
    return { kind: 'present', start: first.start, end: second.end };
}
function renderManagedBlock(body, eol) {
    const [marker] = findMarkers(body);
    if (marker) {
        throw new ManagedBlockError(marker.line, 'el contenido del bloque contiene un marcador SDD');
    }
    return toEol(`${BLOCK_BEGIN}\n${body.trimEnd()}\n${BLOCK_END}`, eol);
}
function appendBlock(text, block, eol) {
    if (text.length === 0)
        return `${block}${eol}`;
    const separator = text.endsWith('\n') ? eol : `${eol}${eol}`;
    return `${text}${separator}${block}${eol}`;
}
/**
 * Inserta o actualiza el bloque SDD sin tocar el texto que queda fuera de él.
 * Lanza ManagedBlockError si los marcadores existentes están mal formados.
 */
export function upsertManagedBlock(text, body, eol) {
    const scan = scanManagedBlock(text);
    if (scan.kind === 'malformed')
        throw new ManagedBlockError(scan.line, scan.reason);
    const block = renderManagedBlock(body, eol);
    if (scan.kind === 'absent')
        return appendBlock(text, block, eol);
    return `${text.slice(0, scan.start)}${block}${text.slice(scan.end)}`;
}
//# sourceMappingURL=managed-block.js.map