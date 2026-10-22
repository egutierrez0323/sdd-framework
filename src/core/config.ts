import fs from 'node:fs/promises';
import path from 'node:path';

export type SeverityLevel = 'L1' | 'L2' | 'L3';

export interface SddConfig {
  version: string;
  projectName: string;
  severity: SeverityLevel;
  locale: 'en' | 'es';
  projectType: 'greenfield' | 'brownfield';
  bridges: Array<'cursor' | 'claude' | 'copilot' | 'antigravity'>;
  graph: {
    engine: 'builtin' | 'graphify' | 'hybrid';
    autoUpdateOnAudit: boolean;
  };
  paths: {
    sddDir: string;
    specsDir: string;
    plansDir: string;
    tasksDir: string;
    templatesDir: string;
  };
  autonomous: {
    maxRetries: number;
    createFeatureBranch: boolean;
    branchPrefix: string;
  };
}

export const DEFAULT_CONFIG: SddConfig = {
  version: '1.0.0',
  projectName: 'my-project',
  severity: 'L2',
  locale: 'en',
  projectType: 'greenfield',
  bridges: ['antigravity', 'cursor', 'claude', 'copilot'],
  graph: {
    engine: 'builtin',
    autoUpdateOnAudit: false,
  },
  paths: {
    sddDir: '.sdd',
    specsDir: '.sdd/specs',
    plansDir: '.sdd/plans',
    tasksDir: '.sdd/tasks',
    templatesDir: '.sdd/templates',
  },
  autonomous: {
    maxRetries: 3,
    createFeatureBranch: true,
    branchPrefix: 'sdd/',
  },
};

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? (T[K] extends unknown[] ? T[K] : DeepPartial<T[K]>) : T[K] };

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Fusiona objetos anidados sin mutarlos; los arrays se sustituyen y los valores `undefined` se ignoran.
 */
function deepMerge(base: PlainObject, override: PlainObject | null | undefined): PlainObject {
  const result: PlainObject = { ...base };
  for (const [key, value] of Object.entries(override ?? {})) {
    if (value === undefined) continue;
    const current = result[key];
    result[key] = isPlainObject(value) && isPlainObject(current) ? deepMerge(current, value) : value;
  }
  return result;
}

/**
 * Prioridad: valores por defecto < configuración existente < valores pasados explícitamente.
 * Conserva las claves que el equipo haya añadido por su cuenta.
 */
export function mergeConfig(existing: DeepPartial<SddConfig> | null, explicit: DeepPartial<SddConfig>): SddConfig {
  const withExisting = deepMerge(DEFAULT_CONFIG as unknown as PlainObject, existing as PlainObject | null);
  return deepMerge(withExisting, explicit as PlainObject) as unknown as SddConfig;
}

function configPathOf(projectRoot: string): string {
  return path.join(projectRoot, '.sdd', 'config.json');
}

/**
 * Lee `.sdd/config.json` tolerando el BOM de los editores de Windows. Devuelve null si no existe y
 * lanza un error claro si no es JSON válido, para que nadie lo sobrescriba creyendo que está vacío.
 */
export async function readConfigFile(projectRoot: string): Promise<DeepPartial<SddConfig> | null> {
  let raw: string;
  try {
    raw = await fs.readFile(configPathOf(projectRoot), 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }

  try {
    return JSON.parse(raw.replace(/^﻿/, ''));
  } catch {
    throw new Error('.sdd/config.json no es JSON válido; corrígelo antes de continuar (no se sobrescribirá).');
  }
}

export async function loadConfig(projectRoot: string = process.cwd()): Promise<SddConfig> {
  let existing: DeepPartial<SddConfig> | null = null;
  try {
    existing = await readConfigFile(projectRoot);
  } catch {
    // Configuración ilegible: se trabaja con los valores por defecto, igual que sin archivo.
  }
  const config = mergeConfig(existing, {});
  return { ...config, projectName: existing?.projectName || path.basename(projectRoot) };
}

export async function saveConfig(config: SddConfig, projectRoot: string = process.cwd()): Promise<void> {
  await fs.mkdir(path.join(projectRoot, '.sdd'), { recursive: true });
  await fs.writeFile(configPathOf(projectRoot), JSON.stringify(config, null, 2), 'utf-8');
}
