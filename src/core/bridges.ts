import path from 'node:path';
import { fileExists, readFileUtf8, writeFileUtf8 } from '../utils/fs-helpers.js';

export type SupportedBridge = 'cursor' | 'claude' | 'copilot' | 'antigravity';

export interface SyncReport {
  synced: SupportedBridge[];
  skipped: SupportedBridge[];
  details: Record<SupportedBridge, string>;
}

export async function syncBridges(
  projectRoot: string = process.cwd(),
  bridges: SupportedBridge[] = ['cursor', 'claude', 'copilot', 'antigravity']
): Promise<SyncReport> {
  const agentsMdPath = path.join(projectRoot, 'AGENTS.md');
  if (!(await fileExists(agentsMdPath))) {
    throw new Error('No se encontró AGENTS.md en la raíz del proyecto para sincronizar puentes.');
  }

  const constitutionContent = await readFileUtf8(agentsMdPath);
  const report: SyncReport = {
    synced: [],
    skipped: [],
    details: {} as Record<SupportedBridge, string>,
  };

  for (const bridge of bridges) {
    try {
      switch (bridge) {
        case 'cursor': {
          const target = path.join(projectRoot, '.cursorrules');
          const banner = `<!-- SINCRONIZADO AUTOMÁTICAMENTE DESDE AGENTS.md (SDD FRAMEWORK) -->\n\n`;
          await writeFileUtf8(target, `${banner}${constitutionContent}`);
          report.synced.push('cursor');
          report.details.cursor = target;
          break;
        }

        case 'claude': {
          const target = path.join(projectRoot, 'CLAUDE.md');
          const banner = `<!-- SINCRONIZADO AUTOMÁTICAMENTE DESDE AGENTS.md (SDD FRAMEWORK) -->\n\n`;
          await writeFileUtf8(target, `${banner}${constitutionContent}`);
          report.synced.push('claude');
          report.details.claude = target;
          break;
        }

        case 'copilot': {
          const target = path.join(projectRoot, '.github', 'copilot-instructions.md');
          const banner = `<!-- SINCRONIZADO AUTOMÁTICAMENTE DESDE AGENTS.md (SDD FRAMEWORK) -->\n\n`;
          await writeFileUtf8(target, `${banner}${constitutionContent}`);
          report.synced.push('copilot');
          report.details.copilot = target;
          break;
        }

        case 'antigravity': {
          const target = path.join(projectRoot, '.agents', 'rules', 'sdd-rules.md');
          const banner = `<!-- REGLAS DE DESARROLLO SDD PARA ANTIGRAVITY -->\n\n`;
          await writeFileUtf8(target, `${banner}${constitutionContent}`);
          report.synced.push('antigravity');
          report.details.antigravity = target;
          break;
        }

        default:
          report.skipped.push(bridge);
      }
    } catch (err: any) {
      report.skipped.push(bridge);
      report.details[bridge] = `Error: ${err.message}`;
    }
  }

  return report;
}
