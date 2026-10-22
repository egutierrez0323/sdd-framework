import fs from 'node:fs/promises';
import path from 'node:path';
import { fileExists } from '../utils/fs-helpers.js';
import { decodeText, encodeText, InvalidEncodingError } from '../utils/text-file.js';
import { scanManagedBlock, upsertManagedBlock, ManagedBlockError } from './managed-block.js';
import { applyFilePlan, createBackupStamp } from './file-plan.js';
import { isLegacyConstitution, resolveLegacyBridge } from './bridge-migration.js';
export const CONSTITUTION_PATH = '.sdd/constitution.md';
const AGENTS_PATH = 'AGENTS.md';
const AGENTS_TARGET = { id: 'agents', relPath: AGENTS_PATH, body: 'inline' };
const BRIDGE_TARGETS = {
    cursor: { id: 'cursor', relPath: '.cursorrules', body: 'inline' },
    claude: { id: 'claude', relPath: 'CLAUDE.md', body: 'import' },
    copilot: { id: 'copilot', relPath: '.github/copilot-instructions.md', body: 'inline' },
    antigravity: { id: 'antigravity', relPath: '.agents/rules/sdd-rules.md', body: 'inline' },
};
const ALL_BRIDGES = Object.keys(BRIDGE_TARGETS);
function isSupportedBridge(id) {
    return Object.prototype.hasOwnProperty.call(BRIDGE_TARGETS, id);
}
/**
 * Ruta del puente, o undefined si `.sdd/config.json` trae un identificador desconocido.
 */
export function bridgeRelPath(bridge) {
    return isSupportedBridge(bridge) ? BRIDGE_TARGETS[bridge].relPath : undefined;
}
async function readTextIfExists(root, relPath) {
    const filePath = path.join(root, relPath);
    if (!(await fileExists(filePath)))
        return null;
    return decodeText(await fs.readFile(filePath), relPath).text;
}
/**
 * La 1.x siempre generaba UTF-8: un `AGENTS.md` en otra codificación es del equipo, no una constitución
 * heredada ni el original de una copia; para esos fines se trata como si no existiera.
 */
async function readAgentsText(root) {
    try {
        return await readTextIfExists(root, AGENTS_PATH);
    }
    catch (err) {
        if (err instanceof InvalidEncodingError)
            return null;
        throw err;
    }
}
async function readLegacyConstitution(root) {
    const agents = await readAgentsText(root);
    return agents !== null && isLegacyConstitution(agents) ? agents : null;
}
/**
 * Origen de la constitución: `.sdd/constitution.md` o, si aún no existe, la constitución que la 1.x
 * generaba en `AGENTS.md` (`legacy-agents`), que el plan migra (REQ-BRIDGE-11). Null si no hay ninguna.
 */
export async function resolveConstitution(root) {
    const constitution = await readTextIfExists(root, CONSTITUTION_PATH);
    if (constitution !== null)
        return { kind: 'file', relPath: CONSTITUTION_PATH, text: constitution };
    const legacy = await readLegacyConstitution(root);
    return legacy !== null ? { kind: 'legacy-agents', relPath: AGENTS_PATH, text: legacy } : null;
}
function assertNoMarkers(source) {
    const scan = scanManagedBlock(source.text);
    if (scan.kind !== 'absent') {
        throw new Error(`${source.relPath} contiene un marcador del bloque SDD y rompería los puentes; elimínalo antes de sincronizar.`);
    }
}
/**
 * `CLAUDE.md` importa el archivo (Claude Code resuelve `@ruta`); el resto de agentes no sigue enlaces
 * de forma fiable y recibe el texto completo.
 */
function buildBlockBody(target, constitutionText) {
    if (target.body === 'import')
        return `@${CONSTITUTION_PATH}`;
    const origin = `<!-- Origen: ${CONSTITUTION_PATH} · gestionado por SDD, no editar dentro del bloque -->`;
    return `${origin}\n${constitutionText}`;
}
function selectTargets(bridges) {
    const unique = [...new Set(bridges)].filter(isSupportedBridge).map((bridge) => BRIDGE_TARGETS[bridge]);
    return [AGENTS_TARGET, ...unique];
}
/**
 * Con la migración de REQ-BRIDGE-11, el texto de `AGENTS.md` pasa a `.sdd/constitution.md`
 * y en `AGENTS.md` solo queda el bloque.
 */
function resolveBaseText(target, text, context) {
    if (target.id === 'agents' && context.migratingAgents)
        return { baseText: '' };
    return resolveLegacyBridge(target.relPath, text, context.agentsText);
}
function planExistingTarget(target, body, before, context) {
    const content = decodeText(before, target.relPath);
    const legacy = resolveBaseText(target, content.text, context);
    const after = encodeText({ ...content, text: upsertManagedBlock(legacy.baseText, body, content.eol) });
    if (after.equals(before))
        return null;
    if (legacy.warning)
        context.warnings.push(legacy.warning);
    const firstInsertion = scanManagedBlock(content.text).kind === 'absent';
    return { kind: 'modify', relPath: target.relPath, before, after, backup: firstInsertion };
}
/**
 * Un archivo con marcadores rotos o en otra codificación se convierte en un cambio `error`:
 * no se toca y el resto de puentes se sigue procesando.
 */
function toFileError(relPath, err) {
    if (err instanceof ManagedBlockError)
        return { kind: 'error', relPath, message: err.reason, line: err.line };
    if (err instanceof InvalidEncodingError)
        return { kind: 'error', relPath, message: err.message };
    throw err;
}
async function planTarget(target, context) {
    const body = buildBlockBody(target, context.constitutionText);
    const filePath = path.join(context.root, target.relPath);
    if (!(await fileExists(filePath))) {
        const text = upsertManagedBlock('', body, '\n');
        return { kind: 'create', relPath: target.relPath, after: encodeText({ text, hasBom: false, eol: '\n' }) };
    }
    try {
        return planExistingTarget(target, body, await fs.readFile(filePath), context);
    }
    catch (err) {
        return toFileError(target.relPath, err);
    }
}
/**
 * Calcula, sin escribir nada, los cambios que dejan cada puente con el bloque SDD al día.
 * `pendingConstitution` es la constitución que el mismo plan va a crear (`sdd init` en un proyecto
 * sin `.sdd/constitution.md`): se usa como si ya existiera en disco.
 */
export async function planBridgeSync(root, bridges = ALL_BRIDGES, pendingConstitution) {
    const source = pendingConstitution !== undefined
        ? { kind: 'file', relPath: CONSTITUTION_PATH, text: pendingConstitution }
        : await resolveConstitution(root);
    if (source === null) {
        throw new Error(`No se encontró ${CONSTITUTION_PATH}. Ejecuta \`sdd init\` para crear la constitución SDD.`);
    }
    assertNoMarkers(source);
    // AGENTS.md se lee antes de cualquier cambio: es la referencia de las copias 1.x (REQ-BRIDGE-10).
    const migratingAgents = source.kind === 'legacy-agents';
    const context = {
        root,
        constitutionText: source.text,
        agentsText: await readAgentsText(root),
        migratingAgents,
        warnings: [],
    };
    // La constitución 1.x se copia byte a byte, con su BOM y sus finales de línea (REQ-BRIDGE-11).
    const agentsRaw = migratingAgents ? await fs.readFile(path.join(root, AGENTS_PATH)) : null;
    const changes = agentsRaw ? [{ kind: 'create', relPath: CONSTITUTION_PATH, after: agentsRaw }] : [];
    for (const target of selectTargets(bridges)) {
        const change = await planTarget(target, context);
        if (change)
            changes.push(change);
    }
    return { changes, warnings: context.warnings };
}
function buildSyncReport(root, bridges, plan, applied) {
    const failed = applied.errors.map(({ relPath, message, line }) => ({ relPath, message, line }));
    const details = {};
    const report = { synced: [], skipped: [], details, failed, backups: applied.backups, warnings: plan.warnings };
    const failedPaths = new Set(failed.map((failure) => failure.relPath));
    for (const bridge of new Set(bridges)) {
        if (!isSupportedBridge(bridge) || failedPaths.has(BRIDGE_TARGETS[bridge].relPath)) {
            report.skipped.push(bridge);
            continue;
        }
        report.synced.push(bridge);
        report.details[bridge] = path.join(root, BRIDGE_TARGETS[bridge].relPath);
    }
    return report;
}
/**
 * Calcula y aplica la sincronización de puentes: solo se modifica el bloque SDD de cada archivo.
 */
export async function syncBridges(projectRoot = process.cwd(), bridges = ALL_BRIDGES) {
    const plan = await planBridgeSync(projectRoot, bridges);
    const applied = await applyFilePlan(plan, projectRoot, createBackupStamp());
    return buildSyncReport(projectRoot, bridges, plan, applied);
}
//# sourceMappingURL=bridges.js.map