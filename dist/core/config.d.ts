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
export declare function loadConfig(projectRoot?: string): Promise<SddConfig>;
export declare function saveConfig(config: SddConfig, projectRoot?: string): Promise<void>;
//# sourceMappingURL=config.d.ts.map