import fs from 'node:fs/promises';
import path from 'node:path';
import { ensureDir } from '../utils/fs-helpers.js';
import { unifiedDiff } from '../utils/line-diff.js';
import { CliIO, isAffirmative } from '../utils/prompt.js';

export type FileError = { kind: 'error'; relPath: string; message: string; line?: number };

export type FileChange =
  | { kind: 'create'; relPath: string; after: Buffer }
  | { kind: 'modify'; relPath: string; before: Buffer; after: Buffer; backup: boolean }
  | FileError;

type WriteChange = Exclude<FileChange, FileError>;

export interface FilePlan {
  changes: FileChange[];
  warnings: string[];
}

export interface ApplyReport {
  written: string[];
  backups: string[];
  errors: FileError[];
}

export interface ExecuteOptions {
  root: string;
  dryRun: boolean;
  yes: boolean;
  io: CliIO;
  stamp?: string;
  log?: (message: string) => void;
}

export interface ExecuteResult {
  exitCode: number;
  cancelled: boolean;
  report?: ApplyReport;
}

const BACKUP_DIR = '.sdd/backups';

export function createBackupStamp(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `${day}-${time}`;
}

function toPosix(relPath: string): string {
  return relPath.replace(/\\/g, '/');
}

function resolveInside(root: string, relPath: string): string {
  const base = path.resolve(root);
  const target = path.resolve(base, relPath);
  const relative = path.relative(base, target);
  if (relative === '' || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`la ruta sale de la raíz del proyecto: ${relPath}`);
  }
  return target;
}

async function readIfExists(filePath: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

/**
 * Evita sobrescribir lo que cambió en disco entre el cálculo del plan y su aplicación.
 */
async function assertUnchangedSincePlan(change: WriteChange, target: string): Promise<void> {
  const current = await readIfExists(target);
  if (change.kind === 'create' && current !== null) {
    throw new Error('el archivo ya existe; vuelve a calcular el plan');
  }
  if (change.kind === 'modify' && (current === null || !current.equals(change.before))) {
    throw new Error('el archivo cambió desde que se calculó el plan; vuelve a ejecutar el comando');
  }
}

async function writeBackup(root: string, stamp: string, relPath: string, original: Buffer): Promise<string> {
  const backupRel = `${BACKUP_DIR}/${stamp}/${toPosix(relPath)}`;
  const backupPath = resolveInside(root, backupRel);
  await ensureDir(path.dirname(backupPath));
  await fs.writeFile(backupPath, original, { flag: 'wx' });
  return backupRel;
}

async function applyChange(change: WriteChange, root: string, stamp: string, report: ApplyReport): Promise<void> {
  const target = resolveInside(root, change.relPath);
  await assertUnchangedSincePlan(change, target);

  if (change.kind === 'modify' && change.backup) {
    report.backups.push(await writeBackup(root, stamp, change.relPath, change.before));
  }

  await ensureDir(path.dirname(target));
  await fs.writeFile(target, change.after, { flag: change.kind === 'create' ? 'wx' : 'w' });
  report.written.push(change.relPath);
}

/**
 * Aplica el plan cambio a cambio: un error en un archivo no impide aplicar los demás.
 */
export async function applyFilePlan(plan: FilePlan, root: string, stamp: string): Promise<ApplyReport> {
  const report: ApplyReport = { written: [], backups: [], errors: [] };

  for (const change of plan.changes) {
    if (change.kind === 'error') {
      report.errors.push(change);
      continue;
    }
    try {
      await applyChange(change, root, stamp, report);
    } catch (err) {
      report.errors.push({ kind: 'error', relPath: change.relPath, message: (err as Error).message });
    }
  }

  return report;
}

function decodeForDisplay(content: Buffer): string {
  return content.toString('utf-8').replace(/^﻿/, '');
}

function countLines(content: Buffer): number {
  const text = decodeForDisplay(content);
  if (text.length === 0) return 0;
  const breaks = (text.match(/\n/g) ?? []).length;
  return text.endsWith('\n') ? breaks : breaks + 1;
}

function formatError(error: FileError): string {
  const line = error.line !== undefined ? ` (línea ${error.line})` : '';
  return `${error.relPath}: ${error.message}${line}`;
}

function renderChange(change: FileChange): string {
  if (change.kind === 'create') {
    const lines = countLines(change.after);
    return `+ crear      ${change.relPath} (${lines} ${lines === 1 ? 'línea' : 'líneas'})`;
  }
  if (change.kind === 'error') return `✖ error      ${formatError(change)}`;

  const header = `~ modificar  ${change.relPath}${change.backup ? ' (con respaldo)' : ''}`;
  const diff = unifiedDiff(change.relPath, decodeForDisplay(change.before), decodeForDisplay(change.after));
  return diff ? `${header}\n${diff.trimEnd()}` : header;
}

function renderSummary(plan: FilePlan): string {
  const count = (kind: FileChange['kind']) => plan.changes.filter((change) => change.kind === kind).length;
  return `Resumen: ${count('create')} a crear, ${count('modify')} a modificar, ${count('error')} con error.`;
}

/**
 * Describe el plan para `--dry-run` y para la confirmación: las modificaciones con su diff unificado
 * y las creaciones con su número de líneas.
 */
export function renderFilePlan(plan: FilePlan): string {
  if (plan.changes.length === 0 && plan.warnings.length === 0) return 'Sin cambios.';

  const warnings = plan.warnings.map((warning) => `⚠ aviso      ${warning}`);
  return [...plan.changes.map(renderChange), ...warnings, renderSummary(plan)].join('\n');
}

/**
 * Pide confirmación solo si el plan modifica archivos existentes; crear archivos nuevos no la requiere.
 */
export async function confirmFilePlan(plan: FilePlan, io: CliIO): Promise<boolean> {
  const modified = plan.changes.filter((change) => change.kind === 'modify').map((change) => change.relPath);
  if (modified.length === 0) return true;

  const list = modified.map((relPath) => `  - ${relPath}`).join('\n');
  return isAffirmative(await io.ask(`Se modificarán estos archivos existentes:\n${list}\n¿Continuar? (s/N) `));
}

function renderApplyReport(report: ApplyReport): string {
  const lines = [`Archivos escritos: ${report.written.length}.`];
  if (report.backups.length > 0) {
    lines.push(`Respaldos:\n${report.backups.map((backup) => `  - ${backup}`).join('\n')}`);
  }
  lines.push(...report.errors.map((error) => `✖ ${formatError(error)}`));
  return lines.join('\n');
}

/**
 * Punto único de `init`, `sync` y `reverse`: muestra el plan y, según `--dry-run`, `--yes` y la terminal,
 * lo simula, lo confirma o lo aplica. Devuelve 1 si algún archivo quedó con error.
 */
export async function executeFilePlan(plan: FilePlan, options: ExecuteOptions): Promise<ExecuteResult> {
  const log = options.log ?? console.log;
  log(renderFilePlan(plan));

  if (options.dryRun) {
    log('Simulación (--dry-run): no se escribió ningún archivo.');
    const hasErrors = plan.changes.some((change) => change.kind === 'error');
    return { exitCode: hasErrors ? 1 : 0, cancelled: false };
  }

  const mustConfirm = options.io.isTTY && !options.yes;
  if (mustConfirm && !(await confirmFilePlan(plan, options.io))) {
    log('Cancelado: no se modificó ningún archivo.');
    return { exitCode: 0, cancelled: true };
  }

  const report = await applyFilePlan(plan, options.root, options.stamp ?? createBackupStamp());
  log(renderApplyReport(report));
  return { exitCode: report.errors.length > 0 ? 1 : 0, cancelled: false, report };
}
