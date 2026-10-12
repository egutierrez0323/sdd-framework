import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { GitClient } from '../utils/git-client.js';
import { Logger } from '../utils/logger.js';

const execAsync = promisify(exec);

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

export function parseTasksMarkdown(content: string): MicroTask[] {
  const tasks: MicroTask[] = [];
  const lines = content.split(/\r?\n/);

  let currentTask: Partial<MicroTask> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Detectar - [ ] **TASK-xxx**: Título o - [x] o - [BLOCKED]
    const taskMatch = line.match(/^[-*]\s+\[( |x|X|BLOCKED)\]\s+\*\*(TASK-[A-Za-z0-9-_]+)\*\*:\s*(.+)$/i);
    if (taskMatch) {
      if (currentTask && currentTask.id) {
        tasks.push(finalizeTask(currentTask));
      }

      let status: TaskStatus = 'PENDING';
      const mark = taskMatch[1].trim().toUpperCase();
      if (mark === 'X') status = 'DONE';
      else if (mark === 'BLOCKED') status = 'BLOCKED';

      currentTask = {
        id: taskMatch[2].trim(),
        title: taskMatch[3].trim(),
        status,
        line: lineNum,
      };
      continue;
    }

    if (!currentTask) continue;

    // Requisito Asociado
    const reqMatch = line.match(/[-*]\s+\*\*Requisito Asociado:\*\*\s*(.+)$/i);
    if (reqMatch) {
      currentTask.reqId = reqMatch[1].trim();
      continue;
    }

    // Verificación
    const verifyMatch = line.match(/[-*]\s+\*\*Verificaci[oó]n:\*\*\s*`?([^`]+)`?$/i);
    if (verifyMatch) {
      currentTask.verifyCommand = verifyMatch[1].trim();
      continue;
    }
  }

  if (currentTask && currentTask.id) {
    tasks.push(finalizeTask(currentTask));
  }

  return tasks;
}

function finalizeTask(partial: Partial<MicroTask>): MicroTask {
  return {
    id: partial.id || 'TASK-UNKNOWN',
    title: partial.title || 'Sin título',
    reqId: partial.reqId,
    status: partial.status || 'PENDING',
    verifyCommand: partial.verifyCommand,
    line: partial.line || 1,
  };
}

export function updateTaskStatusInMarkdown(
  content: string,
  taskId: string,
  newStatus: TaskStatus
): string {
  const lines = content.split(/\r?\n/);
  const mark = newStatus === 'DONE' ? 'x' : newStatus === 'BLOCKED' ? 'BLOCKED' : ' ';

  const updatedLines = lines.map((line) => {
    const regex = new RegExp(`^([-*]\\s+\\[)[ xXBLOCKED]+(\\]\\s+\\*\\*${taskId}\\*\\*:)`, 'i');
    if (regex.test(line)) {
      return line.replace(regex, `$1${mark}$2`);
    }
    return line;
  });

  return updatedLines.join('\n');
}

export interface RunnerOptions {
  cwd?: string;
  maxRetries?: number;
  featureBranch?: string;
  executor?: (cmd: string) => Promise<{ code: number; output: string }>;
}

export async function runTaskVerification(
  command: string,
  cwd: string = process.cwd(),
  customExecutor?: (cmd: string) => Promise<{ code: number; output: string }>
): Promise<{ success: boolean; output: string }> {
  if (customExecutor) {
    const res = await customExecutor(command);
    return { success: res.code === 0, output: res.output };
  }

  try {
    const { stdout, stderr } = await execAsync(command, { cwd });
    return { success: true, output: stdout || stderr };
  } catch (error: any) {
    return { success: false, output: error.stdout || error.stderr || error.message };
  }
}

export async function executeAutonomousPlan(
  tasksMarkdown: string,
  options: RunnerOptions = {}
): Promise<{ updatedMarkdown: string; result: AutoRunResult }> {
  const cwd = options.cwd || process.cwd();
  const maxRetries = options.maxRetries ?? 3;
  const git = new GitClient(cwd);
  let currentMarkdown = tasksMarkdown;
  const completedTasks: string[] = [];

  if (options.featureBranch) {
    await git.createOrCheckoutBranch(options.featureBranch);
  }

  const tasks = parseTasksMarkdown(currentMarkdown);
  const pendingTasks = tasks.filter((t) => t.status === 'PENDING');

  for (const task of pendingTasks) {
    Logger.arbiter('AUDITOR', `Iniciando verificación para ${task.id}: "${task.title}"`);
    const verifyCmd = task.verifyCommand || 'npm test';

    let success = false;
    let attempts = 0;
    let lastError = '';

    while (!success && attempts < maxRetries) {
      attempts++;
      Logger.info(`Intento ${attempts}/${maxRetries} para ${task.id}...`);
      const res = await runTaskVerification(verifyCmd, cwd, options.executor);

      if (res.success) {
        success = true;
        Logger.success(`Verificación superada para ${task.id}`);
      } else {
        lastError = res.output;
        Logger.warn(`Fallo en intento ${attempts}: ${lastError.slice(0, 150)}`);
      }
    }

    if (success) {
      currentMarkdown = updateTaskStatusInMarkdown(currentMarkdown, task.id, 'DONE');
      completedTasks.push(task.id);
      const commitMsg = `feat(${task.reqId || 'SDD'}): ${task.id} completada y verificada`;
      await git.commit(commitMsg);
    } else {
      Logger.error(`Tarea ${task.id} falló tras ${maxRetries} intentos consecutivos.`);
      Logger.arbiter('AUDITOR', `Ejecutando rollback limpio (git reset/clean)...`);
      await git.resetHardAndClean();

      currentMarkdown = updateTaskStatusInMarkdown(currentMarkdown, task.id, 'BLOCKED');

      return {
        updatedMarkdown: currentMarkdown,
        result: {
          completedTasks,
          blockedTask: task.id,
          reason: `Falló verificación tras ${maxRetries} intentos: ${lastError}`,
          success: false,
        },
      };
    }
  }

  return {
    updatedMarkdown: currentMarkdown,
    result: {
      completedTasks,
      success: true,
    },
  };
}
