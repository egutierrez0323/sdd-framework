export interface ProjectScanResult {
    projectPath: string;
    projectName: string;
    ecosystem: 'node' | 'python' | 'rust' | 'go' | 'polyglot' | 'unknown';
    detectedLanguages: string[];
    testRunner?: string;
    buildTool?: string;
    dependencies: string[];
    devDependencies: string[];
    mainDirectories: string[];
    packageScripts: Record<string, string>;
}
export declare function scanProject(projectRoot: string): Promise<ProjectScanResult>;
export declare function generateReverseConstitution(scan: ProjectScanResult): string;
export declare function generateReverseBaselineSpec(scan: ProjectScanResult): string;
//# sourceMappingURL=reverse-engine.d.ts.map