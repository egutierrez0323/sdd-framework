export type SupportedBridge = 'cursor' | 'claude' | 'copilot' | 'antigravity';
export interface SyncReport {
    synced: SupportedBridge[];
    skipped: SupportedBridge[];
    details: Record<SupportedBridge, string>;
}
export declare function syncBridges(projectRoot?: string, bridges?: SupportedBridge[]): Promise<SyncReport>;
//# sourceMappingURL=bridges.d.ts.map