export interface DuplicateBlock {
    sourceFile: string;
    targetFile: string;
    startLineSource: number;
    startLineTarget: number;
    lineCount: number;
    snippet: string;
}
export interface FunctionMetric {
    file: string;
    name: string;
    lineCount: number;
    paramCount: number;
    lineStart: number;
    isOverLimit: boolean;
}
export interface ReviewFinding {
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    category: 'DRY' | 'COMPLEXITY' | 'CLEAN_CODE';
    file: string;
    line?: number;
    message: string;
    suggestion: string;
}
export interface ProjectReviewReport {
    timestamp: string;
    filesScanned: number;
    totalLines: number;
    qualityScore: number;
    duplicates: DuplicateBlock[];
    longFunctions: FunctionMetric[];
    findings: ReviewFinding[];
    summary: {
        cleanCodeStatus: 'EXCELLENT' | 'GOOD' | 'NEEDS_REFACTOR' | 'CRITICAL';
        dryViolationsCount: number;
        highComplexityCount: number;
    };
}
export interface ReviewOptions {
    minDuplicateLines?: number;
    maxFunctionLines?: number;
    maxParameters?: number;
}
/**
 * Detecta bloques duplicados entre un conjunto de archivos usando sliding window de n líneas.
 */
export declare function findDuplicateBlocks(files: {
    path: string;
    content: string;
}[], minLines?: number): DuplicateBlock[];
/**
 * Analiza métricas de funciones en un archivo TypeScript/JavaScript.
 */
export declare function analyzeFunctionMetrics(filePath: string, content: string, maxLines?: number, maxParams?: number): FunctionMetric[];
/**
 * Ejecuta una revisión completa del proyecto o directorio indicado.
 */
export declare function reviewProject(targetPath: string, rootDir?: string, options?: ReviewOptions): Promise<ProjectReviewReport>;
/**
 * Formatea el reporte de revisión para salida limpia y profesional en consola.
 */
export declare function formatReviewReport(report: ProjectReviewReport): string;
//# sourceMappingURL=code-reviewer.d.ts.map