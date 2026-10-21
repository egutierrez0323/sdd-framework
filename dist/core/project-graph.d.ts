export interface GraphNode {
    id: string;
    name: string;
    type: 'module' | 'interface' | 'utility' | 'test';
    exports: string[];
    imports: string[];
    approxTokens: number;
}
export interface ProjectGraph {
    nodes: GraphNode[];
    edges: Array<{
        from: string;
        to: string;
    }>;
    stats: {
        totalFiles: number;
        totalExports: number;
        rawTokensEstimate: number;
        graphTokensEstimate: number;
        tokenReductionPercent: number;
    };
}
export declare function generateProjectGraph(projectRoot?: string, targetExtensions?: string[]): Promise<ProjectGraph>;
export declare function formatMermaidGraph(graph: ProjectGraph): string;
export declare function saveProjectGraphArtifacts(graph: ProjectGraph, projectRoot?: string): Promise<{
    jsonPath: string;
    mermaidPath: string;
    externalDeepGraph?: string;
}>;
//# sourceMappingURL=project-graph.d.ts.map