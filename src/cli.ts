#!/usr/bin/env node

import path from 'node:path';
import { loadConfig, saveConfig, SeverityLevel, DEFAULT_CONFIG } from './core/config.js';
import { validateSpec } from './core/ears-validator.js';
import { scanProject, generateReverseConstitution, generateReverseBaselineSpec } from './core/reverse-engine.js';
import { syncBridges, SupportedBridge } from './core/bridges.js';
import { executeAutonomousPlan } from './core/auto-runner.js';
import readline from 'node:readline/promises';
import {
  generateClarificationSession,
  formatClarificationMarkdown,
  runAutoGrillSession,
  auditArchitectDecision,
  injectDecisionsIntoSpec,
} from './core/clarifier.js';
import { generateProjectGraph, saveProjectGraphArtifacts } from './core/project-graph.js';
import { reviewProject, formatReviewReport } from './core/code-reviewer.js';
import { ensureDir, fileExists, readFileUtf8, writeFileUtf8, listFilesRecursive } from './utils/fs-helpers.js';
import { Logger } from './utils/logger.js';

const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();

async function printHelp() {
  Logger.banner('SDD FRAMEWORK & SUPERVISOR CLI (v1.0.0)');
  console.log(`Uso: sdd <comando> [opciones]

Comandos disponibles:
  init                     Inicializa la estructura SDD (.sdd/, AGENTS.md, plantillas)
                           Opciones: --severity L1|L2|L3

  reverse                  Ingeniería inversa en proyecto brownfield (genera AGENTS.md y SPEC-000)

  new-spec <nombre>        Crea una nueva especificación EARS desde la plantilla oficial

  clarify <archivo|id>     Lanza el Árbitro (Inquisidor) para formular preguntas de casos límite

  grill <archivo|id>       Modo 'Grill-Me': Interrogatorio socrático intensivo antes de planificar

  graph                    Genera el grafo de dependencias y arquitectura para reducir tokens

  audit [archivo|carpeta]  Audita especificaciones contra sintaxis EARS y nivel de severidad configurado

  review [ruta]            Audita código limpio, detecta duplicación (DRY) y complejidad

  run <archivo-tasks>      Ejecuta el bucle autónomo verificable sobre una lista de micro-tareas

  sync                     Sincroniza AGENTS.md con Cursor (.cursorrules), Claude (CLAUDE.md), etc.

  help                     Muestra este mensaje de ayuda
`);
}

async function handleInit() {
  const root = process.cwd();
  Logger.banner('INICIALIZACIÓN DEL ENTORNO SDD');

  let severity: SeverityLevel = 'L2';
  const sevIndex = args.indexOf('--severity');
  if (sevIndex !== -1 && args[sevIndex + 1]) {
    const candidate = args[sevIndex + 1].toUpperCase();
    if (['L1', 'L2', 'L3'].includes(candidate)) {
      severity = candidate as SeverityLevel;
    }
  }

  Logger.info(`Configurando severidad del árbitro: ${severity}`);
  await ensureDir(path.join(root, '.sdd', 'specs'));
  await ensureDir(path.join(root, '.sdd', 'plans'));
  await ensureDir(path.join(root, '.sdd', 'tasks'));
  await ensureDir(path.join(root, '.sdd', 'templates'));

  const config = {
    ...DEFAULT_CONFIG,
    projectName: path.basename(root),
    severity,
  };
  await saveConfig(config, root);

  // Si no existe AGENTS.md, crearlo
  const agentsPath = path.join(root, 'AGENTS.md');
  if (!(await fileExists(agentsPath))) {
    const templateContent = `# Constitución del Proyecto: ${config.projectName}

> **PRINCIPIO FUNDAMENTAL:** Ningún código de producción sin requisito EARS previo ni micro-tarea asociada en .sdd/tasks/.

## 1. Severidad Configurada: ${severity}
- **L1 (Velocity):** Sugerencias no bloqueantes.
- **L2 (Standard):** EARS obligatorio, 100% tareas con tests y comandos de verificación.
- **L3 (Draconian):** Cero tolerancia a ambigüedades, modelado de resiliencia y rollback formal.

## 2. Flujo de Trabajo
1. Redactar \`spec.md\` con \`sdd new-spec\`.
2. Clarificar con el árbitro usando \`sdd clarify\`.
3. Diseñar \`plan.md\` y micro-tareas en \`tasks.md\`.
4. Ejecutar con verificación mediante \`sdd run\`.
`;
    await writeFileUtf8(agentsPath, templateContent);
    Logger.success('Creado archivo de constitución AGENTS.md');
  }

  // Sincronizar puentes
  await syncBridges(root, config.bridges as SupportedBridge[]);
  Logger.success('Estructura SDD y puentes de IA inicializados correctamente.');
}

async function handleReverse() {
  const root = process.cwd();
  Logger.banner('INGENIERÍA INVERSA SDD (BROWNFIELD / REVERSE-SDD)');
  Logger.info('Escaneando estructura de archivos, stack y dependencias...');

  const scan = await scanProject(root);
  Logger.info(`Ecosistema detectado: ${scan.ecosystem.toUpperCase()}`);
  Logger.info(`Lenguajes: ${scan.detectedLanguages.join(', ') || 'No detectados'}`);
  Logger.info(`Comando de test detectado: ${scan.testRunner || 'npm test'}`);

  await ensureDir(path.join(root, '.sdd', 'specs'));
  await ensureDir(path.join(root, '.sdd', 'plans'));
  await ensureDir(path.join(root, '.sdd', 'tasks'));

  const agentsPath = path.join(root, 'AGENTS.md');
  if (!(await fileExists(agentsPath))) {
    const constitution = generateReverseConstitution(scan);
    await writeFileUtf8(agentsPath, constitution);
    Logger.success('Generada constitución adaptada en AGENTS.md');
  } else {
    Logger.warn('AGENTS.md ya existe. Se conservó la versión actual.');
  }

  const baselineSpecPath = path.join(root, '.sdd', 'specs', 'SPEC-000-BASELINE.md');
  if (!(await fileExists(baselineSpecPath))) {
    const baselineSpec = generateReverseBaselineSpec(scan);
    await writeFileUtf8(baselineSpecPath, baselineSpec);
    Logger.success('Generada especificación de línea base: SPEC-000-BASELINE.md');
  }

  await syncBridges(root);
  Logger.success('Ingeniería inversa completada con éxito.');
}

async function handleNewSpec() {
  const specName = args[1];
  if (!specName) {
    Logger.error('Debes proporcionar un nombre para la especificación. Ej: sdd new-spec auth-jwt');
    process.exit(1);
  }

  const root = process.cwd();
  const id = specName.toUpperCase().replace(/[^A-Z0-9]/g, '-');
  const targetPath = path.join(root, '.sdd', 'specs', `SPEC-${id}.md`);

  if (await fileExists(targetPath)) {
    Logger.error(`La especificación SPEC-${id}.md ya existe.`);
    process.exit(1);
  }

  const content = `# SPEC-${id}: ${specName}

- **Estado:** DRAFT
- **Fecha:** ${new Date().toISOString().split('T')[0]}
- **Nivel de Severidad:** L2 (Standard)

---

## 1. Contexto y Justificación
<!-- Describe el problema a resolver -->

---

## 2. Requerimientos del Sistema (Notación EARS)

### REQ-${id}-01: [Nombre Requerimiento]
- **Tipo EARS:** Event-driven
- **Declaración:**
  > CUANDO [evento], el sistema deberá [resultado].
- **Criterio de Aceptación:**
  - **DADO:** [Contexto inicial]
  - **CUANDO:** [Acción ejecutada]
  - **ENTONCES:** [Efecto medible]

### REQ-${id}-02: [Manejo de Errores]
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > SI [fallo], ENTONCES el sistema deberá [recuperación].
- **Criterio de Aceptación:**
  - **DADO:** [Error detectado]
  - **CUANDO:** [Falla la condición]
  - **ENTONCES:** [Manejo seguro]
`;

  await writeFileUtf8(targetPath, content);
  Logger.success(`Especificación creada en: ${targetPath}`);
}

async function resolveSpecFile(
  target: string | undefined,
  commandName: string
): Promise<{ filePath: string; content: string; severity: SeverityLevel }> {
  if (!target) {
    Logger.error(`Debes especificar el archivo de la especificación. Ej: sdd ${commandName} .sdd/specs/SPEC-001.md`);
    process.exit(1);
  }

  const root = process.cwd();
  const config = await loadConfig(root);
  const filePath = path.isAbsolute(target) ? target : path.join(root, target);

  if (!(await fileExists(filePath))) {
    Logger.error(`No se encontró el archivo: ${filePath}`);
    process.exit(1);
  }

  const content = await readFileUtf8(filePath);
  return { filePath, content, severity: config.severity };
}

async function handleClarify() {
  const { filePath, content, severity } = await resolveSpecFile(args[1], 'clarify');
  const questions = generateClarificationSession(content, severity);

  Logger.arbiter('INQUISITOR', `Sesión de clarificación generada (${questions.length} preguntas de estrés):`);
  for (const q of questions) {
    console.log(`\n• [${q.id}] (${q.category}):\n  ${q.question}\n  💡 Sugerencia: ${q.recommendation}`);
  }

  const outPath = filePath.replace(/\.md$/, '-clarification.md');
  await writeFileUtf8(outPath, formatClarificationMarkdown(path.basename(filePath), questions));
  Logger.success(`Registro de clarificación guardado en: ${outPath}`);
}

async function handleAudit() {
  const root = process.cwd();
  const config = await loadConfig(root);
  const target = args[1] || path.join(root, '.sdd', 'specs');

  let filesToAudit: string[] = [];
  if (await fileExists(target)) {
    const stat = await (await import('node:fs/promises')).stat(target);
    if (stat.isDirectory()) {
      filesToAudit = (await listFilesRecursive(target, '.md')).filter(
        (f) => !f.endsWith('-clarification.md') && !f.endsWith('-grill-session.md')
      );
    } else {
      filesToAudit = [target];
    }
  }

  if (filesToAudit.length === 0) {
    Logger.warn('No se encontraron especificaciones Markdown para auditar.');
    return;
  }

  Logger.banner(`AUDITORÍA DEL ÁRBITRO SDD (NIVEL: ${config.severity})`);
  let hasErrors = false;

  for (const file of filesToAudit) {
    const content = await readFileUtf8(file);
    const report = validateSpec(content, config.severity);

    console.log(`\n📄 Archivo: ${path.relative(root, file)}`);
    console.log(`   Requerimientos detectados: ${report.totalRequirements}`);

    if (report.warnings.length > 0) {
      for (const w of report.warnings) {
        Logger.warn(`Línea ${w.line || '?'}: ${w.message}`);
      }
    }

    if (report.errors.length > 0) {
      hasErrors = true;
      for (const e of report.errors) {
        Logger.error(`Línea ${e.line || '?'}: ${e.message}`);
      }
    } else {
      Logger.success('Especificación cumple todos los criterios EARS y severidad.');
    }
  }

  if (hasErrors) {
    Logger.arbiter('AUDITOR', 'La auditoría detectó violaciones bloqueantes en los contratos.');
    process.exit(1);
  } else {
    Logger.arbiter('AUDITOR', 'Todas las especificaciones auditadas están en regla.');
  }
}

async function handleRun() {
  const target = args[1];
  if (!target) {
    Logger.error('Debes indicar el archivo de tareas. Ej: sdd run .sdd/tasks/TASKS-001.md');
    process.exit(1);
  }

  const root = process.cwd();
  const filePath = path.isAbsolute(target) ? target : path.join(root, target);

  if (!(await fileExists(filePath))) {
    Logger.error(`No se encontró el archivo de tareas: ${filePath}`);
    process.exit(1);
  }

  Logger.banner('BUCLE DE EJECUCIÓN AUTÓNOMA DESATENDIDA');
  const content = await readFileUtf8(filePath);

  const { updatedMarkdown, result } = await executeAutonomousPlan(content, {
    cwd: root,
    maxRetries: 3,
  });

  await writeFileUtf8(filePath, updatedMarkdown);

  if (result.success) {
    Logger.success(`Ejecución completada con éxito. Tareas resueltas: ${result.completedTasks.length}`);
  } else {
    Logger.error(`Ejecución detenida de forma segura. Tarea bloqueada: ${result.blockedTask}`);
    console.error(`Motivo: ${result.reason}`);
    process.exit(1);
  }
}

async function handleSync() {
  const root = process.cwd();
  const config = await loadConfig(root);
  Logger.banner('SINCRONIZACIÓN DE PUENTES AGENTICOS');
  const report = await syncBridges(root, config.bridges as SupportedBridge[]);

  for (const b of report.synced) {
    Logger.success(`Puente sincronizado: [${b}] -> ${report.details[b]}`);
  }
  for (const s of report.skipped) {
    Logger.warn(`Puente omitido: [${s}]`);
  }
}

async function handleGraph() {
  const root = process.cwd();
  Logger.banner('GENERACIÓN DE GRAFO DE ARQUITECTURA Y REDUCCIÓN DE TOKENS');
  Logger.info('Analizando AST, módulos, imports y exportaciones...');

  const graph = await generateProjectGraph(root);
  const artifacts = await saveProjectGraphArtifacts(graph, root);

  Logger.success(`Archivos de código analizados: ${graph.stats.totalFiles}`);
  Logger.success(`Símbolos y contratos exportados: ${graph.stats.totalExports}`);
  Logger.info(`Tokens estimados en código completo: ~${graph.stats.rawTokensEstimate}`);
  Logger.info(`Tokens estimados en grafo indexado: ~${graph.stats.graphTokensEstimate}`);
  Logger.arbiter(
    'AUDITOR',
    `¡Reducción del consumo de tokens alcanzada: ${graph.stats.tokenReductionPercent}%!`
  );

  Logger.success(`Grafo visual Mermaid guardado en: ${artifacts.mermaidPath}`);
  Logger.success(`Índice semántico JSON guardado en: ${artifacts.jsonPath}`);
}

async function handleGrill() {
  const { filePath, content, severity } = await resolveSpecFile(args[1], 'grill');

  Logger.banner('MODO GRILL-ME: INTERROGATORIO SOCRÁTICO DEL ÁRBITRO');
  Logger.arbiter('INQUISITOR', 'Ejecutando Auto-Grill de la IA (inspección de código y filtrado de ruido)...');

  const autoGrill = runAutoGrillSession(content, severity);
  if (autoGrill.autoResolved.length > 0) {
    Logger.info(`[Auto-Grill IA] ${autoGrill.autoResolved.length} puntos resueltos internamente según el contexto del código.`);
    for (const ar of autoGrill.autoResolved) {
      console.log(`   ✔ [${ar.id}] ${ar.category}: ${ar.autoResolutionReason}`);
    }
  }

  const questions = autoGrill.escalatedToHuman;
  Logger.arbiter('INQUISITOR', `Dilemas de arquitectura escalados al líder humano: ${questions.length}`);

  const isInteractive = Boolean(process.stdin.isTTY);
  const decisionsMap: Record<string, string> = {};
  const recordedDecisions: Array<{ questionId: string; category: string; decision: string }> = [];

  if (isInteractive && questions.length > 0) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        let answered = false;

        while (!answered) {
          console.log(`\n🔥 [PREGUNTA ${i + 1}/${questions.length}] Categoría: ${q.category}`);
          console.log(`   ${q.question}`);
          console.log('\n   Opciones:');
          q.options.forEach((opt, idx) => {
            console.log(`   [${idx + 1}] ${opt}`);
          });
          console.log(`   [0] Escribir decisión personalizada`);

          const answer = (await rl.question(`\n   👉 Selecciona una opción (1-${q.options.length}) o escribe tu decisión: `)).trim();
          let decisionText = '';
          const num = parseInt(answer, 10);
          if (!isNaN(num) && num >= 1 && num <= q.options.length) {
            decisionText = q.options[num - 1];
          } else if (num === 0) {
            decisionText = (await rl.question('   ✍  Escribe tu decisión arquitectónica: ')).trim();
          } else if (answer.length > 0) {
            decisionText = answer;
          } else {
            // Default: recomendada
            decisionText = q.options[0];
          }

          // Auditoría Anti-Complacencia (Devil's Advocate)
          const violations = auditArchitectDecision(decisionText);
          if (violations.length > 0) {
            console.log('\n⚖ [ÁRBITRO SDD :: ALERTA ANTI-COMPLACENCIA / DEVIL\'S ADVOCATE]');
            for (const v of violations) {
              Logger.warn(`[${v.severity}] ${v.issue}`);
              console.log(`   Violación: ${v.violatedInvariant}`);
              Logger.info(`   💡 Recomendación: ${v.recommendation}`);
            }
            const confirm = (await rl.question('\n   ¿Deseas mantener esta decisión a pesar de la advertencia o cambiarla? (m=mantener / C=cambiar): ')).trim().toLowerCase();
            if (confirm !== 'm' && confirm !== 'mantener') {
              console.log('   🔄 Rectificando respuesta...');
              continue;
            }
          }

          decisionsMap[q.id] = decisionText;
          recordedDecisions.push({ questionId: q.id, category: q.category, decision: decisionText });
          answered = true;
          Logger.success(`Registrada decisión para [${q.id}]`);
        }
      }
    } finally {
      rl.close();
    }

    // Aplicar decisiones al archivo de la spec
    const updatedSpec = injectDecisionsIntoSpec(content, recordedDecisions);
    await writeFileUtf8(filePath, updatedSpec);
    Logger.success(`Especificación actualizada con decisiones vinculantes y aprobada: ${filePath}`);
  } else {
    // Modo no interactivo (CI/pipes)
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      console.log(`\n🔥 [PREGUNTA ${i + 1}/${questions.length}] Categoría: ${q.category}`);
      console.log(`   ${q.question}`);
      console.log(`   👉 Respuesta Recomendada: ${q.recommendation}`);
      if (q.options) {
        q.options.forEach((opt, idx) => console.log(`      [${idx + 1}] ${opt}`));
      }
    }
  }

  const outPath = filePath.replace(/\.md$/, '-grill-session.md');
  await writeFileUtf8(outPath, formatClarificationMarkdown(path.basename(filePath), questions, decisionsMap));
  Logger.success(`\nSesión Grill-Me documentada en: ${outPath}`);
}

async function handleReview() {
  const target = args[1] || 'src';
  Logger.banner('AUDITORÍA DE CÓDIGO LIMPIO Y DRY (SDD REVIEW)');
  Logger.info(`Analizando archivos en: ${target}`);
  const report = await reviewProject(target, process.cwd());
  console.log('\n' + formatReviewReport(report));
  if (report.qualityScore < 60) {
    Logger.error('Puntuación de calidad crítica. Se requiere refactorización antes de merge/commit.');
    process.exit(1);
  }
}

async function main() {
  switch (command) {
    case 'init':
      await handleInit();
      break;
    case 'reverse':
      await handleReverse();
      break;
    case 'new-spec':
      await handleNewSpec();
      break;
    case 'clarify':
      await handleClarify();
      break;
    case 'grill':
      await handleGrill();
      break;
    case 'graph':
      await handleGraph();
      break;
    case 'audit':
      await handleAudit();
      break;
    case 'review':
      await handleReview();
      break;
    case 'run':
      await handleRun();
      break;
    case 'sync':
      await handleSync();
      break;
    case 'help':
    case '--help':
    case '-h':
    default:
      await printHelp();
      break;
  }
}

main().catch((err) => {
  Logger.error(`Error inesperado: ${err.message}`);
  process.exit(1);
});
