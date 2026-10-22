import fs from 'node:fs/promises';
import path from 'node:path';
export const DEFAULT_CONFIG = {
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
function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/**
 * Fusiona objetos anidados sin mutarlos; los arrays se sustituyen y los valores `undefined` se ignoran.
 */
function deepMerge(base, override) {
    const result = { ...base };
    for (const [key, value] of Object.entries(override ?? {})) {
        if (value === undefined)
            continue;
        const current = result[key];
        result[key] = isPlainObject(value) && isPlainObject(current) ? deepMerge(current, value) : value;
    }
    return result;
}
/**
 * Prioridad: valores por defecto < configuración existente < valores pasados explícitamente.
 * Conserva las claves que el equipo haya añadido por su cuenta.
 */
export function mergeConfig(existing, explicit) {
    const withExisting = deepMerge(DEFAULT_CONFIG, existing);
    return deepMerge(withExisting, explicit);
}
function configPathOf(projectRoot) {
    return path.join(projectRoot, '.sdd', 'config.json');
}
/**
 * Lee `.sdd/config.json` tolerando el BOM de los editores de Windows. Devuelve null si no existe y
 * lanza un error claro si no es JSON válido, para que nadie lo sobrescriba creyendo que está vacío.
 */
export async function readConfigFile(projectRoot) {
    let raw;
    try {
        raw = await fs.readFile(configPathOf(projectRoot), 'utf-8');
    }
    catch (err) {
        if (err.code === 'ENOENT')
            return null;
        throw err;
    }
    try {
        return JSON.parse(raw.replace(/^﻿/, ''));
    }
    catch {
        throw new Error('.sdd/config.json no es JSON válido; corrígelo antes de continuar (no se sobrescribirá).');
    }
}
export async function loadConfig(projectRoot = process.cwd()) {
    let existing = null;
    try {
        existing = await readConfigFile(projectRoot);
    }
    catch {
        // Configuración ilegible: se trabaja con los valores por defecto, igual que sin archivo.
    }
    const config = mergeConfig(existing, {});
    return { ...config, projectName: existing?.projectName || path.basename(projectRoot) };
}
export async function saveConfig(config, projectRoot = process.cwd()) {
    await fs.mkdir(path.join(projectRoot, '.sdd'), { recursive: true });
    await fs.writeFile(configPathOf(projectRoot), JSON.stringify(config, null, 2), 'utf-8');
}
//# sourceMappingURL=config.js.map