import { SeverityLevel } from './config.js';
import { SupportedBridge } from './bridges.js';
export interface ScaffoldOptions {
    projectRoot: string;
    projectName?: string;
    mode: 'greenfield' | 'brownfield';
    severity: SeverityLevel;
    bridges: SupportedBridge[];
    includeSkills: boolean;
    locale?: 'en' | 'es';
    graphEngine?: 'builtin' | 'graphify' | 'hybrid';
}
export interface ScaffoldResult {
    createdFiles: string[];
    createdDirs: string[];
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
export declare function scaffoldProject(options: ScaffoldOptions): Promise<ScaffoldResult>;
//# sourceMappingURL=scaffold.d.ts.map