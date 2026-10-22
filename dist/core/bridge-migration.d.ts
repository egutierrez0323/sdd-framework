/**
 * Banners con los que SDD 1.x encabezaba los puentes que copiaba íntegros desde `AGENTS.md`.
 */
export declare const LEGACY_BANNERS: readonly ["<!-- SINCRONIZADO AUTOMÁTICAMENTE DESDE AGENTS.md (SDD FRAMEWORK) -->", "<!-- REGLAS DE DESARROLLO SDD PARA ANTIGRAVITY -->"];
/**
 * Cabecera con la que la 1.x generaba la constitución dentro de `AGENTS.md`.
 */
export declare const LEGACY_CONSTITUTION_HEADER = "# Constituci\u00F3n del Proyecto:";
export declare function isLegacyConstitution(text: string): boolean;
export type LegacyBridgeKind = 'none' | 'pure-copy' | 'edited';
export interface LegacyBridgeResolution {
    baseText: string;
    warning?: string;
}
/**
 * Clasifica un puente según lo que dejó SDD 1.x. Un puente que ya tiene el bloque se considera
 * migrado (`none`), para no repetir la migración ni su aviso en cada `sync`.
 */
export declare function classifyLegacyBridge(bridgeText: string, agentsText: string | null): LegacyBridgeKind;
/**
 * Texto sobre el que insertar el bloque: vacío si el puente era una copia exacta de `AGENTS.md`
 * (el contenido ya vive en la constitución) y el original, con un aviso, si alguien lo editó.
 */
export declare function resolveLegacyBridge(relPath: string, bridgeText: string, agentsText: string | null): LegacyBridgeResolution;
//# sourceMappingURL=bridge-migration.d.ts.map