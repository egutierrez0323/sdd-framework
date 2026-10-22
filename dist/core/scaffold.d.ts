import { SeverityLevel } from './config.js';
import { SupportedBridge } from './bridges.js';
import { FilePlan } from './file-plan.js';
/**
 * `severity`, `bridges`, `locale` y `graphEngine` son opcionales: si no se pasan, se conserva el valor
 * de `.sdd/config.json` o, en un proyecto nuevo, el valor por defecto.
 */
export interface ScaffoldOptions {
    projectRoot: string;
    projectName?: string;
    mode: 'greenfield' | 'brownfield';
    severity?: SeverityLevel;
    bridges?: SupportedBridge[];
    includeSkills: boolean;
    locale?: 'en' | 'es';
    graphEngine?: 'builtin' | 'graphify' | 'hybrid';
}
export interface ScaffoldResult {
    createdFiles: string[];
    modifiedFiles: string[];
    createdDirs: string[];
    backups: string[];
    failed: Array<{
        relPath: string;
        message: string;
        line?: number;
    }>;
    mode: 'greenfield' | 'brownfield';
    severity: SeverityLevel;
    syncedBridges: string[];
    graphEngine: 'builtin' | 'graphify' | 'hybrid';
}
export declare const BUILTIN_TEMPLATES: {
    spec: string;
    plan: string;
    tasks: string;
    earsGuide: string;
};
export declare const BUILTIN_SKILLS: Record<string, string>;
export declare function generateStandardConstitution(projectName: string, severity: SeverityLevel): string;
/**
 * Calcula, sin escribir nada, todo lo que haría `sdd init`: es la base de `--dry-run` (REQ-BRIDGE-08).
 */
export declare function planScaffold(options: ScaffoldOptions): Promise<FilePlan>;
/**
 * Plan de `sdd reverse`: línea base y constitución inversa (solo si faltan) y los puentes de `config.bridges`.
 */
export declare function planReverse(projectRoot: string): Promise<FilePlan>;
/**
 * Las carpetas vacías no forman parte del plan de archivos: se crean después de aplicarlo.
 */
export declare function ensureScaffoldDirs(projectRoot: string): Promise<string[]>;
/**
 * Orquestador de `sdd init`: calcula el plan de archivos y lo aplica (con respaldos) de una vez.
 */
export declare function scaffoldProject(options: ScaffoldOptions): Promise<ScaffoldResult>;
//# sourceMappingURL=scaffold.d.ts.map