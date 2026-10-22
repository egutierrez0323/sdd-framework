import { scanManagedBlock } from './managed-block.js';

/**
 * Banners con los que SDD 1.x encabezaba los puentes que copiaba íntegros desde `AGENTS.md`.
 */
export const LEGACY_BANNERS = [
  '<!-- SINCRONIZADO AUTOMÁTICAMENTE DESDE AGENTS.md (SDD FRAMEWORK) -->',
  '<!-- REGLAS DE DESARROLLO SDD PARA ANTIGRAVITY -->',
] as const;

/**
 * Cabecera con la que la 1.x generaba la constitución dentro de `AGENTS.md`.
 */
export const LEGACY_CONSTITUTION_HEADER = '# Constitución del Proyecto:';

export function isLegacyConstitution(text: string): boolean {
  return text.startsWith(LEGACY_CONSTITUTION_HEADER);
}

export type LegacyBridgeKind = 'none' | 'pure-copy' | 'edited';

export interface LegacyBridgeResolution {
  baseText: string;
  warning?: string;
}

/**
 * Compara ignorando el BOM y los finales de línea: un checkout con `core.autocrlf` convierte a CRLF
 * tanto el puente como `AGENTS.md`, y la 1.x copiaba el BOM de `AGENTS.md` detrás del banner.
 */
function normalizeCopy(text: string): string {
  return text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
}

function stripBanner(text: string, banner: string): string {
  return text.slice(banner.length).replace(/^(\r?\n){0,2}/, '');
}

/**
 * Clasifica un puente según lo que dejó SDD 1.x. Un puente que ya tiene el bloque se considera
 * migrado (`none`), para no repetir la migración ni su aviso en cada `sync`.
 */
export function classifyLegacyBridge(bridgeText: string, agentsText: string | null): LegacyBridgeKind {
  const banner = LEGACY_BANNERS.find((candidate) => bridgeText.startsWith(candidate));
  if (!banner || scanManagedBlock(bridgeText).kind !== 'absent') return 'none';
  if (agentsText === null) return 'edited';

  const copied = stripBanner(bridgeText, banner);
  return normalizeCopy(copied) === normalizeCopy(agentsText) ? 'pure-copy' : 'edited';
}

/**
 * Texto sobre el que insertar el bloque: vacío si el puente era una copia exacta de `AGENTS.md`
 * (el contenido ya vive en la constitución) y el original, con un aviso, si alguien lo editó.
 */
export function resolveLegacyBridge(relPath: string, bridgeText: string, agentsText: string | null): LegacyBridgeResolution {
  const kind = classifyLegacyBridge(bridgeText, agentsText);
  if (kind === 'pure-copy') return { baseText: '' };
  if (kind === 'none') return { baseText: bridgeText };

  return {
    baseText: bridgeText,
    warning: `${relPath} tiene el banner de SDD 1.x pero no coincide con AGENTS.md: se conserva su texto y se añade el bloque al final.`,
  };
}
