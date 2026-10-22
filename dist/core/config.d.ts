export type SeverityLevel = 'L1' | 'L2' | 'L3';
export interface SddConfig {
    version: string;
    projectName: string;
    severity: SeverityLevel;
    locale: 'en' | 'es';
    projectType: 'greenfield' | 'brownfield';
    bridges: Array<'cursor' | 'claude' | 'copilot' | 'antigravity'>;
    graph: {
        engine: 'builtin' | 'graphify' | 'hybrid';
        autoUpdateOnAudit: boolean;
    };
    paths: {
        sddDir: string;
        specsDir: string;
        plansDir: string;
        tasksDir: string;
        templatesDir: string;
    };
    autonomous: {
        maxRetries: number;
        createFeatureBranch: boolean;
        branchPrefix: string;
    };
}
export declare const DEFAULT_CONFIG: SddConfig;
export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? (T[K] extends unknown[] ? T[K] : DeepPartial<T[K]>) : T[K];
};
/**
 * Prioridad: valores por defecto < configuración existente < valores pasados explícitamente.
 * Conserva las claves que el equipo haya añadido por su cuenta.
 */
export declare function mergeConfig(existing: DeepPartial<SddConfig> | null, explicit: DeepPartial<SddConfig>): SddConfig;
/**
 * Lee `.sdd/config.json` tolerando el BOM de los editores de Windows. Devuelve null si no existe y
 * lanza un error claro si no es JSON válido, para que nadie lo sobrescriba creyendo que está vacío.
 */
export declare function readConfigFile(projectRoot: string): Promise<DeepPartial<SddConfig> | null>;
export declare function loadConfig(projectRoot?: string): Promise<SddConfig>;
export declare function saveConfig(config: SddConfig, projectRoot?: string): Promise<void>;
//# sourceMappingURL=config.d.ts.map