import { Eol } from '../utils/text-file.js';
export declare const BLOCK_BEGIN = "<!-- SDD:BEGIN -->";
export declare const BLOCK_END = "<!-- SDD:END -->";
export type BlockScan = {
    kind: 'absent';
} | {
    kind: 'present';
    start: number;
    end: number;
} | {
    kind: 'malformed';
    line: number;
    reason: string;
};
export declare class ManagedBlockError extends Error {
    readonly line: number;
    readonly reason: string;
    constructor(line: number, reason: string);
}
export declare function scanManagedBlock(text: string): BlockScan;
/**
 * Inserta o actualiza el bloque SDD sin tocar el texto que queda fuera de él.
 * Lanza ManagedBlockError si los marcadores existentes están mal formados.
 */
export declare function upsertManagedBlock(text: string, body: string, eol: Eol): string;
//# sourceMappingURL=managed-block.d.ts.map