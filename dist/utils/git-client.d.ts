export interface GitStatus {
    isClean: boolean;
    currentBranch: string;
}
export declare class GitClient {
    private cwd;
    constructor(cwd?: string);
    private run;
    getStatus(): Promise<GitStatus>;
    createOrCheckoutBranch(branchName: string): Promise<void>;
    commit(message: string): Promise<void>;
    resetHardAndClean(): Promise<void>;
}
//# sourceMappingURL=git-client.d.ts.map