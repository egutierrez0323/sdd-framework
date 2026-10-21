export type TaskStatus = 'PENDING' | 'DONE' | 'BLOCKED';
export interface MicroTask {
    id: string;
    title: string;
    reqId?: string;
    status: TaskStatus;
    verifyCommand?: string;
    line: number;
}
export interface AutoRunResult {
    completedTasks: string[];
    blockedTask?: string;
    reason?: string;
    success: boolean;
}
export declare function parseTasksMarkdown(content: string): MicroTask[];
export declare function updateTaskStatusInMarkdown(content: string, taskId: string, newStatus: TaskStatus): string;
export interface RunnerOptions {
    cwd?: string;
    maxRetries?: number;
    featureBranch?: string;
    executor?: (cmd: string) => Promise<{
        code: number;
        output: string;
    }>;
    skipCommit?: boolean;
}
export declare function runTaskVerification(command: string, cwd?: string, customExecutor?: (cmd: string) => Promise<{
    code: number;
    output: string;
}>): Promise<{
    success: boolean;
    output: string;
}>;
export declare function executeAutonomousPlan(tasksMarkdown: string, options?: RunnerOptions): Promise<{
    updatedMarkdown: string;
    result: AutoRunResult;
}>;
//# sourceMappingURL=auto-runner.d.ts.map