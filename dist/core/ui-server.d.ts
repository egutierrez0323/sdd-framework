import http from 'node:http';
import { SeverityLevel } from './config.js';
import { EarsRequirement } from './ears-validator.js';
import { MicroTask } from './auto-runner.js';
export interface SpecData {
    id: string;
    filename: string;
    title: string;
    status: string;
    date?: string;
    severity?: string;
    author?: string;
    context?: string;
    requirementsCount: number;
    requirements: EarsRequirement[];
    decisions: Array<{
        id: string;
        category: string;
        decision: string;
    }>;
}
export interface TaskListData {
    id: string;
    filename: string;
    title: string;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    blockedTasks: number;
    progressPercent: number;
    tasks: MicroTask[];
}
export interface SddDashboardData {
    projectName: string;
    severity: SeverityLevel;
    locale: 'en' | 'es';
    specs: SpecData[];
    plans: Array<{
        id: string;
        filename: string;
        title: string;
        content: string;
    }>;
    tasks: TaskListData[];
    graphMermaid: string;
    constitution: string;
    stats: {
        totalSpecs: number;
        approvedSpecs: number;
        draftSpecs: number;
        totalRequirements: number;
        earsBreakdown: Record<string, number>;
        totalMicroTasks: number;
        completedMicroTasks: number;
        overallProgress: number;
    };
}
export declare function findAvailablePort(startPort?: number): Promise<number>;
export declare function openInBrowser(url: string): void;
export declare function collectSddProjectData(projectRoot: string): Promise<SddDashboardData>;
export declare function startUiServer(options: {
    projectRoot: string;
    port?: number;
    openBrowser?: boolean;
}): Promise<{
    server: http.Server;
    url: string;
    port: number;
}>;
//# sourceMappingURL=ui-server.d.ts.map