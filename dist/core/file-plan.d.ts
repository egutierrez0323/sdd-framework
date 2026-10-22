import { CliIO } from '../utils/prompt.js';
export type FileError = {
    kind: 'error';
    relPath: string;
    message: string;
    line?: number;
};
export type FileChange = {
    kind: 'create';
    relPath: string;
    after: Buffer;
} | {
    kind: 'modify';
    relPath: string;
    before: Buffer;
    after: Buffer;
    backup: boolean;
} | FileError;
export interface FilePlan {
    changes: FileChange[];
    warnings: string[];
}
export interface ApplyReport {
    written: string[];
    backups: string[];
    errors: FileError[];
}
export interface ExecuteOptions {
    root: string;
    dryRun: boolean;
    yes: boolean;
    io: CliIO;
    stamp?: string;
    log?: (message: string) => void;
}
export interface ExecuteResult {
    exitCode: number;
    cancelled: boolean;
    report?: ApplyReport;
}
export declare function createBackupStamp(date?: Date): string;
/**
 * Aplica el plan cambio a cambio: un error en un archivo no impide aplicar los demás.
 */
export declare function applyFilePlan(plan: FilePlan, root: string, stamp: string): Promise<ApplyReport>;
/**
 * Describe el plan para `--dry-run` y para la confirmación: las modificaciones con su diff unificado
 * y las creaciones con su número de líneas.
 */
export declare function renderFilePlan(plan: FilePlan): string;
/**
 * Pide confirmación solo si el plan modifica archivos existentes; crear archivos nuevos no la requiere.
 */
export declare function confirmFilePlan(plan: FilePlan, io: CliIO): Promise<boolean>;
/**
 * Punto único de `init`, `sync` y `reverse`: muestra el plan y, según `--dry-run`, `--yes` y la terminal,
 * lo simula, lo confirma o lo aplica. Devuelve 1 si algún archivo quedó con error.
 */
export declare function executeFilePlan(plan: FilePlan, options: ExecuteOptions): Promise<ExecuteResult>;
//# sourceMappingURL=file-plan.d.ts.map