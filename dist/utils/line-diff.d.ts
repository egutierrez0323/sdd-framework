/**
 * Diff unificado de presentación para `--dry-run`. Recorta las líneas comunes al principio y al final
 * y emite un único hunk: es exacto para los cambios de SDD, que afectan a una sola región contigua.
 * Las diferencias que solo están en los finales de línea no se muestran.
 */
export declare function unifiedDiff(relPath: string, before: string, after: string, context?: number): string;
//# sourceMappingURL=line-diff.d.ts.map