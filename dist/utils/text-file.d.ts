export type Eol = '\r\n' | '\n';
export interface TextContent {
    text: string;
    hasBom: boolean;
    eol: Eol;
}
export declare class InvalidEncodingError extends Error {
    readonly filePath: string;
    constructor(filePath: string);
}
/**
 * Decodifica un archivo de texto conservando su BOM y su fin de línea.
 * Rechaza los bytes que no son UTF-8 válido para no alterar archivos en otra codificación.
 */
export declare function decodeText(raw: Buffer, filePath: string): TextContent;
export declare function encodeText(content: TextContent): Buffer;
export declare function detectEol(text: string): Eol;
/**
 * Ajusta al fin de línea del archivo destino el texto que genera SDD (nunca el del usuario).
 */
export declare function toEol(text: string, eol: Eol): string;
//# sourceMappingURL=text-file.d.ts.map