import { FilePlan } from './file-plan.js';
export type SupportedBridge = 'cursor' | 'claude' | 'copilot' | 'antigravity';
export interface BridgeTarget {
    id: SupportedBridge | 'agents';
    relPath: string;
    body: 'import' | 'inline';
}
export interface SyncReport {
    synced: SupportedBridge[];
    skipped: SupportedBridge[];
    details: Record<SupportedBridge, string>;
    failed: Array<{
        relPath: string;
        message: string;
        line?: number;
    }>;
    backups: string[];
    warnings: string[];
}
export type ConstitutionSource = {
    kind: 'file';
    relPath: string;
    text: string;
} | {
    kind: 'legacy-agents';
    relPath: string;
    text: string;
};
export declare const CONSTITUTION_PATH = ".sdd/constitution.md";
/**
 * Ruta del puente, o undefined si `.sdd/config.json` trae un identificador desconocido.
 */
export declare function bridgeRelPath(bridge: string): string | undefined;
/**
 * Origen de la constitución: `.sdd/constitution.md` o, si aún no existe, la constitución que la 1.x
 * generaba en `AGENTS.md` (`legacy-agents`), que el plan migra (REQ-BRIDGE-11). Null si no hay ninguna.
 */
export declare function resolveConstitution(root: string): Promise<ConstitutionSource | null>;
/**
 * Calcula, sin escribir nada, los cambios que dejan cada puente con el bloque SDD al día.
 * `pendingConstitution` es la constitución que el mismo plan va a crear (`sdd init` en un proyecto
 * sin `.sdd/constitution.md`): se usa como si ya existiera en disco.
 */
export declare function planBridgeSync(root: string, bridges?: SupportedBridge[], pendingConstitution?: string): Promise<FilePlan>;
/**
 * Calcula y aplica la sincronización de puentes: solo se modifica el bloque SDD de cada archivo.
 */
export declare function syncBridges(projectRoot?: string, bridges?: SupportedBridge[]): Promise<SyncReport>;
//# sourceMappingURL=bridges.d.ts.map