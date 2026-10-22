import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { exec } from 'node:child_process';
import { loadConfig, SeverityLevel } from './config.js';
import { parseSpecMarkdown, EarsRequirement } from './ears-validator.js';
import { parseTasksMarkdown, MicroTask } from './auto-runner.js';
import { CONSTITUTION_PATH } from './bridges.js';
import { fileExists, readFileUtf8, listFilesRecursive } from '../utils/fs-helpers.js';
import { generateDashboardHtml } from './ui-html.js';

export interface SpecData {
  id: string;
  filename: string;
  title: string;
  status: string;
  date?: string;
  severity?: string;
  author?: string;
  context?: string;
  requirementsCount: number;
  requirements: EarsRequirement[];
  decisions: Array<{ id: string; category: string; decision: string }>;
}

export interface TaskListData {
  id: string;
  filename: string;
  title: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  blockedTasks: number;
  progressPercent: number;
  tasks: MicroTask[];
}

export interface SddDashboardData {
  projectName: string;
  severity: SeverityLevel;
  locale: 'en' | 'es';
  specs: SpecData[];
  plans: Array<{ id: string; filename: string; title: string; content: string }>;
  tasks: TaskListData[];
  graphMermaid: string;
  constitution: string;
  constitutionPath: string;
  stats: {
    totalSpecs: number;
    approvedSpecs: number;
    draftSpecs: number;
    totalRequirements: number;
    earsBreakdown: Record<string, number>;
    totalMicroTasks: number;
    completedMicroTasks: number;
    overallProgress: number;
  };
}

export async function findAvailablePort(startPort: number = 3333): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

export function openInBrowser(url: string): void {
  const plat = process.platform;
  let cmd = '';
  if (plat === 'win32') {
    cmd = `start "" "${url}"`;
  } else if (plat === 'darwin') {
    cmd = `open "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }
  try {
    exec(cmd);
  } catch {
    // Si no puede abrirse automáticamente, el enlace en terminal es suficiente
  }
}

function extractDecisions(content: string): Array<{ id: string; category: string; decision: string }> {
  const decisions: Array<{ id: string; category: string; decision: string }> = [];
  const decisionRegex = /###\s+\[(CLARIFY-[0-9]+)\]\s+([^\n]+)\n[\s\S]*?-\s+\*\*Decisión Vinculante:\*\*\s*([^\n]+)/gi;
  let match;
  while ((match = decisionRegex.exec(content)) !== null) {
    decisions.push({
      id: match[1],
      category: match[2].trim(),
      decision: match[3].trim(),
    });
  }
  return decisions;
}

function parseSpecMetadata(content: string, filename: string): SpecData {
  const lines = content.split(/\r?\n/);
  const titleMatch = (lines[0] || '').match(/^#\s+(SPEC-[A-Za-z0-9-_]+):\s*(.+)$/i);
  const id = titleMatch ? titleMatch[1] : path.basename(filename, '.md');
  const title = titleMatch ? titleMatch[2].trim() : path.basename(filename, '.md');

  const statusMatch = content.match(/[-*]\s+\*\*Estado:\*\*\s*([A-Za-z_]+)/i);
  const status = statusMatch ? statusMatch[1].toUpperCase() : 'DRAFT';

  const dateMatch = content.match(/[-*]\s+\*\*Fecha(?: de Creación)?:\*\*\s*([0-9-_/]+)/i);
  const sevMatch = content.match(/[-*]\s+\*\*Nivel de Severidad:\*\*\s*(L[1-3])/i);
  const authorMatch = content.match(/[-*]\s+\*\*Autor(?: \/ Responsable)?:\*\*\s*(.+)$/im);

  let context = '';
  const contextMatch = content.match(/## 1\.\s+Contexto y Justificación[^\n]*\n([\s\S]*?)(?=\n---|\n## 2|$)/i);
  if (contextMatch) {
    context = contextMatch[1].replace(/<!--[\s\S]*?-->/g, '').trim();
  }

  const requirements = parseSpecMarkdown(content);
  const decisions = extractDecisions(content);

  return {
    id,
    filename,
    title,
    status,
    date: dateMatch ? dateMatch[1] : undefined,
    severity: sevMatch ? sevMatch[1] : undefined,
    author: authorMatch ? authorMatch[1].trim() : undefined,
    context,
    requirementsCount: requirements.length,
    requirements,
    decisions,
  };
}

async function collectSpecs(projectRoot: string): Promise<{ specs: SpecData[]; earsBreakdown: Record<string, number> }> {
  const specsDir = path.join(projectRoot, '.sdd', 'specs');
  const specFiles = (await fileExists(specsDir))
    ? (await listFilesRecursive(specsDir, '.md')).filter(
        (f) => !f.endsWith('-clarification.md') && !f.endsWith('-grill-session.md')
      )
    : [];

  const specs: SpecData[] = [];
  const earsBreakdown: Record<string, number> = {
    Ubiquitous: 0,
    'Event-driven': 0,
    'State-driven': 0,
    'Unwanted Behavior': 0,
    Optional: 0,
  };

  for (const file of specFiles) {
    const content = await readFileUtf8(file);
    const spec = parseSpecMetadata(content, file);
    specs.push(spec);

    for (const req of spec.requirements) {
      const type = req.type || 'Ubiquitous';
      earsBreakdown[type] = (earsBreakdown[type] || 0) + 1;
    }
  }

  return { specs, earsBreakdown };
}

async function collectTasks(projectRoot: string): Promise<{ tasks: TaskListData[]; totalMicroTasks: number; completedMicroTasks: number }> {
  const tasksDir = path.join(projectRoot, '.sdd', 'tasks');
  const taskFiles = (await fileExists(tasksDir)) ? await listFilesRecursive(tasksDir, '.md') : [];
  const tasks: TaskListData[] = [];

  let totalMicroTasks = 0;
  let completedMicroTasks = 0;

  for (const file of taskFiles) {
    const content = await readFileUtf8(file);
    const parsedTasks = parseTasksMarkdown(content);
    const firstLine = content.split(/\r?\n/)[0] || '';
    const titleMatch = firstLine.match(/^#\s+(TASKS-[A-Za-z0-9-_]+):\s*(.+)$/i);

    const doneCount = parsedTasks.filter((t) => t.status === 'DONE').length;
    const blockedCount = parsedTasks.filter((t) => t.status === 'BLOCKED').length;
    const pendingCount = parsedTasks.filter((t) => t.status === 'PENDING').length;
    const percent = parsedTasks.length > 0 ? Math.round((doneCount / parsedTasks.length) * 100) : 0;

    totalMicroTasks += parsedTasks.length;
    completedMicroTasks += doneCount;

    tasks.push({
      id: titleMatch ? titleMatch[1] : path.basename(file, '.md'),
      filename: file,
      title: titleMatch ? titleMatch[2].trim() : path.basename(file, '.md'),
      totalTasks: parsedTasks.length,
      completedTasks: doneCount,
      pendingTasks: pendingCount,
      blockedTasks: blockedCount,
      progressPercent: percent,
      tasks: parsedTasks,
    });
  }

  return { tasks, totalMicroTasks, completedMicroTasks };
}

async function collectPlans(projectRoot: string): Promise<Array<{ id: string; filename: string; title: string; content: string }>> {
  const plansDir = path.join(projectRoot, '.sdd', 'plans');
  const planFiles = (await fileExists(plansDir)) ? await listFilesRecursive(plansDir, '.md') : [];
  const plans: Array<{ id: string; filename: string; title: string; content: string }> = [];

  for (const file of planFiles) {
    const content = await readFileUtf8(file);
    const firstLine = content.split(/\r?\n/)[0] || '';
    const titleMatch = firstLine.match(/^#\s+(PLAN-[A-Za-z0-9-_]+):\s*(.+)$/i);
    plans.push({
      id: titleMatch ? titleMatch[1] : path.basename(file, '.md'),
      filename: file,
      title: titleMatch ? titleMatch[2].trim() : path.basename(file, '.md'),
      content,
    });
  }

  return plans;
}

/**
 * La constitución vive en `.sdd/constitution.md`; `AGENTS.md` solo se usa en proyectos 1.x sin migrar,
 * porque en la 2.0 es un archivo del equipo o solo contiene el bloque SDD.
 */
async function readConstitution(projectRoot: string): Promise<{ text: string; relPath: string }> {
  for (const relPath of [CONSTITUTION_PATH, 'AGENTS.md']) {
    const filePath = path.join(projectRoot, relPath);
    if (await fileExists(filePath)) return { text: await readFileUtf8(filePath), relPath };
  }
  return { text: '', relPath: '' };
}

export async function collectSddProjectData(projectRoot: string): Promise<SddDashboardData> {
  const config = await loadConfig(projectRoot);
  const { specs, earsBreakdown } = await collectSpecs(projectRoot);
  const { tasks, totalMicroTasks, completedMicroTasks } = await collectTasks(projectRoot);
  const plans = await collectPlans(projectRoot);

  const graphFile = path.join(projectRoot, '.sdd', 'architecture-graph.md');
  const graphMermaid = (await fileExists(graphFile)) ? await readFileUtf8(graphFile) : '';

  const { text: constitution, relPath: constitutionPath } = await readConstitution(projectRoot);

  const approvedSpecs = specs.filter((s) => s.status === 'APPROVED').length;
  const draftSpecs = specs.filter((s) => s.status !== 'APPROVED').length;
  const totalRequirements = specs.reduce((acc, s) => acc + s.requirementsCount, 0);
  const overallProgress = totalMicroTasks > 0 ? Math.round((completedMicroTasks / totalMicroTasks) * 100) : 0;

  return {
    projectName: config.projectName || path.basename(projectRoot),
    severity: config.severity,
    locale: config.locale || 'en',
    specs,
    plans,
    tasks,
    graphMermaid,
    constitution,
    constitutionPath,
    stats: {
      totalSpecs: specs.length,
      approvedSpecs,
      draftSpecs,
      totalRequirements,
      earsBreakdown,
      totalMicroTasks,
      completedMicroTasks,
      overallProgress,
    },
  };
}

export async function startUiServer(options: {
  projectRoot: string;
  port?: number;
  openBrowser?: boolean;
}): Promise<{ server: http.Server; url: string; port: number }> {
  const { projectRoot, openBrowser = true } = options;
  const port = options.port || (await findAvailablePort(3333));
  const htmlContent = generateDashboardHtml();

  const server = http.createServer(async (req, res) => {
    const url = req.url || '/';

    if (url === '/' || url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(htmlContent);
      return;
    }

    if (url === '/api/data') {
      try {
        const data = await collectSddProjectData(projectRoot);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(data));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      const url = `http://localhost:${port}`;
      if (openBrowser) {
        openInBrowser(url);
      }
      resolve({ server, url, port });
    });
  });
}
