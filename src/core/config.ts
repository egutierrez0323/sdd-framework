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

export async function loadConfig(projectRoot: string = process.cwd()): Promise<SddConfig> {
  const configPath = path.join(projectRoot, '.sdd', 'config.json');
  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      paths: {
        ...DEFAULT_CONFIG.paths,
        ...(parsed.paths || {}),
      },
      graph: {
        ...DEFAULT_CONFIG.graph,
        ...(parsed.graph || {}),
      },
      autonomous: {
        ...DEFAULT_CONFIG.autonomous,
        ...(parsed.autonomous || {}),
      },
      projectName: parsed.projectName || path.basename(projectRoot),
    };
  } catch {
    return { ...DEFAULT_CONFIG, projectName: path.basename(projectRoot) };
  }
}

export async function saveConfig(config: SddConfig, projectRoot: string = process.cwd()): Promise<void> {
  const dirPath = path.join(projectRoot, '.sdd');
  await fs.mkdir(dirPath, { recursive: true });
  const configPath = path.join(dirPath, 'config.json');
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}
