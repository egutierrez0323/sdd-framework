#!/usr/bin/env node
import path from 'node:path';
import { loadConfig } from './core/config.js';
import { validateSpec } from './core/ears-validator.js';
import { scanProject } from './core/reverse-engine.js';
import { planBridgeSync } from './core/bridges.js';
import { executeFilePlan } from './core/file-plan.js';
import { executeAutonomousPlan } from './core/auto-runner.js';
import readline from 'node:readline/promises';
import { generateClarificationSession, formatClarificationMarkdown, runAutoGrillSession, auditArchitectDecision, injectDecisionsIntoSpec, } from './core/clarifier.js';
import { generateProjectGraph, saveProjectGraphArtifacts } from './core/project-graph.js';
import { reviewProject, formatReviewReport } from './core/code-reviewer.js';
import { planScaffold, planReverse, ensureScaffoldDirs } from './core/scaffold.js';
import { startUiServer } from './core/ui-server.js';
import { fileExists, readFileUtf8, writeFileUtf8, listFilesRecursive } from './utils/fs-helpers.js';
import { createProcessIO } from './utils/prompt.js';
import { Logger } from './utils/logger.js';
const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();
async function printHelp() {
    Logger.banner('SDD FRAMEWORK & SUPERVISOR CLI (v1.0.0)');
    console.log(`Uso: sdd <comando> [opciones]

Comandos disponibles:
  init                     Inicializa la estructura SDD (.sdd/, constitución, plantillas, skills y bloque SDD en los puentes)
                           Opciones: --severity L1|L2|L3, --lang es|en, --graph-engine builtin|graphify|hybrid,
                                     --greenfield, --brownfield, --no-skills, --dry-run, --yes

  reverse                  Ingeniería inversa en proyecto brownfield (constitución inversa y SPEC-000 si faltan)
                           Opciones: --dry-run, --yes

  new-spec <nombre>        Crea una nueva especificación EARS desde la plantilla oficial

  clarify <archivo|id>     Lanza el Árbitro (Inquisidor) para formular preguntas de casos límite

  grill <archivo|id>       Modo 'Grill-Me': Interrogatorio socrático intensivo antes de planificar

  graph                    Genera el grafo de dependencias y arquitectura para reducir tokens

  audit [archivo|carpeta]  Audita especificaciones contra sintaxis EARS y nivel de severidad configurado

  review [ruta]            Audita código limpio, detecta duplicación (DRY) y complejidad

  run <archivo-tasks>      Ejecuta el bucle autónomo verificable sobre una lista de micro-tareas

  ui, view                 Lanza el visualizador web interactivo de specs, tareas y arquitectura
                           Opciones: --port <puerto>, --no-open

  sync                     Actualiza el bloque SDD de AGENTS.md, CLAUDE.md, .cursorrules, etc. desde .sdd/constitution.md
                           Solo cambia el texto entre <!-- SDD:BEGIN --> y <!-- SDD:END -->.
                           Opciones: --dry-run, --yes

  help                     Muestra este mensaje de ayuda

  --dry-run muestra los archivos que se crearían o modificarían, con su diff, sin escribir nada.
  --yes     aplica sin pedir confirmación (sin terminal interactiva tampoco se pregunta).
`);
}
function parsePlanFlags() {
    return { dryRun: args.includes('--dry-run'), yes: args.includes('--yes') || args.includes('-y') };
}
/**
 * Muestra el plan y, según `--dry-run`, `--yes` y la terminal, lo simula, lo confirma o lo aplica.
 * Devuelve true si se aplicó; el código de salida queda en `process.exitCode`.
 */
async function runFilePlan(plan, root) {
    const { dryRun, yes } = parsePlanFlags();
    const result = await executeFilePlan(plan, { root, dryRun, yes, io: createProcessIO(), log: (message) => console.log(message) });
    process.exitCode = result.exitCode;
    return !dryRun && !result.cancelled;
}
async function askLanguage(rl, defaultLocale = 'en') {
    console.log(`\n◇ [1/5] IDIOMA PRINCIPAL / PRIMARY LANGUAGE:`);
    console.log(`  [1] English (Default / Recommended for international teams)`);
    console.log(`  [2] Español`);
    const choice = (await rl.question(`  › Select / Selecciona [1-2] (default: ${defaultLocale === 'es' ? '2' : '1'}): `)).trim();
    return choice === '2' ? 'es' : 'en';
}
async function askProjectMode(rl, hasCode) {
    console.log(`\n◇ [2/5] TIPO DE PROYECTO:`);
    if (hasCode) {
        console.log(`  ℹ Se detectó código previo en el repositorio.`);
        console.log(`  [1] Greenfield (Empezar como nuevo)`);
        console.log(`  [2] (Recomendado) Brownfield (Proyecto existente: ingeniería inversa y línea base)`);
    }
    else {
        console.log(`  [1] (Recomendado) Greenfield (Proyecto nuevo)`);
        console.log(`  [2] Brownfield (Proyecto existente)`);
    }
    const choice = (await rl.question(`  › Selecciona [1-2] (default: ${hasCode ? '2' : '1'}): `)).trim();
    return choice === '2' ? 'brownfield' : choice === '1' ? 'greenfield' : hasCode ? 'brownfield' : 'greenfield';
}
async function askSeverity(rl, defaultSev) {
    console.log(`\n◇ [3/6] NIVEL DE SEVERIDAD DEL ÁRBITRO:`);
    console.log(`  [1] L1 - Pragmatic (Velocity: alertas no bloqueantes)`);
    console.log(`  [2] (Recomendado) L2 - Standard (Producción: EARS estricto)`);
    console.log(`  [3] L3 - Draconian (Misión Crítica: tolerancia cero)`);
    const choice = (await rl.question(`  › Selecciona la severidad [1-3] (default: 2): `)).trim();
    if (choice === '1')
        return 'L1';
    if (choice === '3')
        return 'L3';
    return defaultSev || 'L2';
}
async function askGraphEngine(rl, locale) {
    if (locale === 'es') {
        console.log(`\n◇ [4/6] MOTOR DE GRAFOS Y ANÁLISIS DE CÓDIGO (GRAPH ENGINE):`);
        console.log(`  Leyenda y recomendaciones de uso:`);
        console.log(`  • [1] Project-Graph Nativo: Recomendado para desarrollo diario y control de tokens.`);
        console.log(`        Macroscópico (< 50ms, módulos y contratos). Ahorra 80-95% tokens sin dependencias externas.`);
        console.log(`  • [2] Graphify: Recomendado para proyectos legados gigantes o refactorizaciones forenses críticas.`);
        console.log(`        Microscópico intra-función (árbol de llamadas privadas de bajo nivel).`);
        console.log(`  • [3] (Recomendado) Híbrido: Macro-grafo nativo para el día a día + detección y enlace automático de Graphify.`);
        const choice = (await rl.question(`  › Selecciona el motor de grafos [1-3] (default: 3): `)).trim();
        if (choice === '1')
            return 'builtin';
        if (choice === '2')
            return 'graphify';
        return 'hybrid';
    }
    else {
        console.log(`\n◇ [4/6] GRAPH ENGINE & CODE ANALYSIS:`);
        console.log(`  Legend & Guidance:`);
        console.log(`  • [1] Builtin Project-Graph: Recommended for daily agile development & strict token budget.`);
        console.log(`        Macroscopic (< 50ms, modules & contracts). Saves 80-95% prompt tokens with zero dependencies.`);
        console.log(`  • [2] Graphify: Recommended for massive legacy codebases or critical forensic refactoring.`);
        console.log(`        Microscopic intra-function call trees (private helpers and low-level call traces).`);
        console.log(`  • [3] (Recommended) Hybrid: Builtin macro-graph for agile daily work + auto-detection of Graphify.`);
        const choice = (await rl.question(`  › Select graph engine [1-3] (default: 3): `)).trim();
        if (choice === '1')
            return 'builtin';
        if (choice === '2')
            return 'graphify';
        return 'hybrid';
    }
}
async function askBridgesAndSkills(rl) {
    console.log(`\n◇ [5/6] ASISTENTES Y EDITORES DE IA:`);
    console.log(`  [1] Cursor (.cursorrules)`);
    console.log(`  [2] Claude Code (CLAUDE.md)`);
    console.log(`  [3] Antigravity / Gemini CLI (AGENTS.md)`);
    console.log(`  [4] (Recomendado) Todos los anteriores`);
    const bChoice = (await rl.question(`  › Selecciona puentes [1-4] (default: 4): `)).trim();
    let bridges = ['cursor', 'claude', 'antigravity'];
    if (bChoice === '1')
        bridges = ['cursor'];
    else if (bChoice === '2')
        bridges = ['claude'];
    else if (bChoice === '3')
        bridges = ['antigravity'];
    console.log(`\n◇ [6/6] ARSENAL DE SKILLS AVANZADAS (.agents/skills/):`);
    console.log(`  [1] (Recomendado) Sí, instalar arsenal completo (grill-me, clean-code, project-graph, graphify, sdd-methodology)`);
    console.log(`  [2] No, solo estructura mínima`);
    const sChoice = (await rl.question(`  › Opción [1-2] (default: 1): `)).trim();
    return { bridges, includeSkills: sChoice !== '2' };
}
async function promptInitInteractively(root, defaultSeverity, defaultLocale) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
        const hasExistingCode = (await fileExists(path.join(root, 'package.json'))) ||
            (await fileExists(path.join(root, 'pyproject.toml'))) ||
            (await fileExists(path.join(root, 'Cargo.toml'))) ||
            (await fileExists(path.join(root, 'go.mod')));
        const locale = await askLanguage(rl, defaultLocale ?? 'en');
        const mode = await askProjectMode(rl, hasExistingCode);
        const severity = await askSeverity(rl, defaultSeverity ?? 'L2');
        const graphEngine = await askGraphEngine(rl, locale);
        const { bridges, includeSkills } = await askBridgesAndSkills(rl);
        return { projectRoot: root, mode, severity, locale, bridges, includeSkills, graphEngine };
    }
    finally {
        rl.close();
    }
}
function readOption(names, allowed, normalize) {
    const index = args.findIndex((arg) => names.includes(arg));
    const candidate = index !== -1 ? args[index + 1] : undefined;
    if (!candidate)
        return undefined;
    const value = normalize(candidate);
    return allowed.includes(value) ? value : undefined;
}
/**
 * Solo devuelve los valores pasados explícitamente: lo que no se pasa se conserva de `.sdd/config.json`
 * o, en un proyecto nuevo, toma su valor por defecto (REQ-BRIDGE-12).
 */
function parseInitCliArgs() {
    const isBrownfield = args.includes('--brownfield');
    const isGreenfield = args.includes('--greenfield');
    return {
        severity: readOption(['--severity'], ['L1', 'L2', 'L3'], (value) => value.toUpperCase()),
        locale: readOption(['--lang', '--locale'], ['en', 'es'], (value) => value.toLowerCase()),
        graphEngine: readOption(['--graph-engine', '--graph'], ['builtin', 'graphify', 'hybrid'], (value) => value.toLowerCase()),
        mode: isBrownfield ? 'brownfield' : isGreenfield ? 'greenfield' : undefined,
        isNonInteractive: !process.stdin.isTTY || parsePlanFlags().yes || isBrownfield || isGreenfield,
    };
}
function nonInteractiveInitOptions(root, cli) {
    return {
        projectRoot: root,
        mode: cli.mode ?? 'greenfield',
        severity: cli.severity,
        locale: cli.locale,
        graphEngine: cli.graphEngine,
        // Mismos puentes que la 1.x en modo no interactivo; elegirlos con --bridges llega con el PR 4.
        bridges: ['cursor', 'claude', 'antigravity'],
        includeSkills: !args.includes('--no-skills'),
    };
}
function printInitSuccess(config, includeSkills) {
    Logger.success(`\n✔ Proyecto inicializado con éxito en modo SDD (${config.projectType})`);
    console.log(`\nEstructura:`);
    console.log(`   • .sdd/ (specs, plans, tasks, templates, config.json)`);
    console.log(`   • Constitución en .sdd/constitution.md`);
    console.log(`   • Bloque SDD (<!-- SDD:BEGIN --> … <!-- SDD:END -->) en AGENTS.md y en: ${config.bridges.join(', ')}`);
    if (includeSkills) {
        console.log(`   • .agents/skills/ (grill-me, clean-code, project-graph, graphify, sdd-methodology)`);
    }
    console.log(`   • Motor de grafos configurado: [${config.graph.engine}]`);
    console.log(`\nSiguientes pasos:`);
    console.log(`   1. Crear tu primera especificación: npx sdd new-spec mi-funcionalidad`);
    console.log(`   2. Someter la especificación al Árbitro: npx sdd grill .sdd/specs/SPEC-MI-FUNCIONALIDAD.md`);
    console.log(`   3. Visualizar en interfaz web: npx sdd ui\n`);
}
async function handleInit() {
    const root = process.cwd();
    Logger.banner('SDD FRAMEWORK :: ASISTENTE DE INICIALIZACIÓN (INIT)');
    const cli = parseInitCliArgs();
    const options = cli.isNonInteractive
        ? nonInteractiveInitOptions(root, cli)
        : await promptInitInteractively(root, cli.severity, cli.locale);
    Logger.info(`Calculando los cambios de SDD en modo [${options.mode.toUpperCase()}]...`);
    if (!(await runFilePlan(await planScaffold(options), root)))
        return;
    await ensureScaffoldDirs(root);
    printInitSuccess(await loadConfig(root), options.includeSkills);
}
async function handleReverse() {
    const root = process.cwd();
    Logger.banner('INGENIERÍA INVERSA SDD (BROWNFIELD / REVERSE-SDD)');
    Logger.info('Escaneando estructura de archivos, stack y dependencias...');
    const scan = await scanProject(root);
    Logger.info(`Ecosistema detectado: ${scan.ecosystem.toUpperCase()}`);
    Logger.info(`Lenguajes: ${scan.detectedLanguages.join(', ') || 'No detectados'}`);
    Logger.info(`Comando de test detectado: ${scan.testRunner || 'npm test'}`);
    if (!(await runFilePlan(await planReverse(root), root)))
        return;
    await ensureScaffoldDirs(root);
    Logger.success('Ingeniería inversa completada.');
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
async function resolveSpecFile(target, commandName) {
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
    let filesToAudit = [];
    if (await fileExists(target)) {
        const stat = await (await import('node:fs/promises')).stat(target);
        if (stat.isDirectory()) {
            filesToAudit = (await listFilesRecursive(target, '.md')).filter((f) => !f.endsWith('-clarification.md') && !f.endsWith('-grill-session.md'));
        }
        else {
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
        }
        else {
            Logger.success('Especificación cumple todos los criterios EARS y severidad.');
        }
    }
    if (hasErrors) {
        Logger.arbiter('AUDITOR', 'La auditoría detectó violaciones bloqueantes en los contratos.');
        process.exit(1);
    }
    else {
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
    }
    else {
        Logger.error(`Ejecución detenida de forma segura. Tarea bloqueada: ${result.blockedTask}`);
        console.error(`Motivo: ${result.reason}`);
        process.exit(1);
    }
}
async function handleSync() {
    const root = process.cwd();
    const config = await loadConfig(root);
    Logger.banner('SINCRONIZACIÓN DE PUENTES AGENTICOS');
    let plan;
    try {
        plan = await planBridgeSync(root, config.bridges);
    }
    catch (err) {
        // Sin constitución o con marcadores dentro: se aborta sin tocar ningún archivo (REQ-BRIDGE-05).
        Logger.error(err.message);
        process.exitCode = 1;
        return;
    }
    await runFilePlan(plan, root);
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
    Logger.arbiter('AUDITOR', `¡Reducción del consumo de tokens alcanzada: ${graph.stats.tokenReductionPercent}%!`);
    Logger.success(`Grafo visual Mermaid guardado en: ${artifacts.mermaidPath}`);
    Logger.success(`Índice semántico JSON guardado en: ${artifacts.jsonPath}`);
}
async function promptGrillInteractively(questions) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const decisionsMap = {};
    const recordedDecisions = [];
    try {
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            let answered = false;
            while (!answered) {
                console.log(`\n• [PREGUNTA ${i + 1}/${questions.length}] Categoría: ${q.category}`);
                console.log(`   ${q.question}`);
                console.log('\n   Opciones:');
                q.options.forEach((opt, idx) => {
                    console.log(`   [${idx + 1}] ${opt}`);
                });
                console.log(`   [0] Escribir decisión personalizada`);
                const answer = (await rl.question(`\n   › Selecciona una opción (1-${q.options.length}) o escribe tu decisión: `)).trim();
                let decisionText = '';
                const num = parseInt(answer, 10);
                if (!isNaN(num) && num >= 1 && num <= q.options.length) {
                    decisionText = q.options[num - 1];
                }
                else if (num === 0) {
                    decisionText = (await rl.question('   › Escribe tu decisión arquitectónica: ')).trim();
                }
                else if (answer.length > 0) {
                    decisionText = answer;
                }
                else {
                    decisionText = q.options[0];
                }
                const violations = auditArchitectDecision(decisionText);
                if (violations.length > 0) {
                    console.log('\n› [ÁRBITRO SDD :: ALERTA ANTI-COMPLACENCIA / DEVIL\'S ADVOCATE]');
                    for (const v of violations) {
                        Logger.warn(`[${v.severity}] ${v.issue}`);
                        console.log(`   Violación: ${v.violatedInvariant}`);
                        Logger.info(`   Recomendación: ${v.recommendation}`);
                    }
                    const confirm = (await rl.question('\n   ¿Deseas mantener esta decisión a pesar de la advertencia o cambiarla? (m=mantener / C=cambiar): ')).trim().toLowerCase();
                    if (confirm !== 'm' && confirm !== 'mantener') {
                        console.log('   › Rectificando respuesta...');
                        continue;
                    }
                }
                decisionsMap[q.id] = decisionText;
                recordedDecisions.push({ questionId: q.id, category: q.category, decision: decisionText });
                answered = true;
                Logger.success(`Registrada decisión para [${q.id}]`);
            }
        }
    }
    finally {
        rl.close();
    }
    return { decisionsMap, recordedDecisions };
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
    let decisionsMap = {};
    if (Boolean(process.stdin.isTTY) && questions.length > 0) {
        const interview = await promptGrillInteractively(questions);
        decisionsMap = interview.decisionsMap;
        const updatedSpec = injectDecisionsIntoSpec(content, interview.recordedDecisions);
        await writeFileUtf8(filePath, updatedSpec);
        Logger.success(`Especificación actualizada con decisiones vinculantes y aprobada: ${filePath}`);
    }
    else {
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            console.log(`\n• [PREGUNTA ${i + 1}/${questions.length}] Categoría: ${q.category}`);
            console.log(`   ${q.question}`);
            console.log(`   › Respuesta Recomendada: ${q.recommendation}`);
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
async function handleUi() {
    const root = process.cwd();
    Logger.banner('SDD FRAMEWORK :: VISUALIZADOR WEB INTERACTIVO');
    let port;
    const portIndex = args.indexOf('--port');
    if (portIndex !== -1 && args[portIndex + 1]) {
        const candidate = parseInt(args[portIndex + 1], 10);
        if (!isNaN(candidate))
            port = candidate;
    }
    const openBrowser = !args.includes('--no-open');
    Logger.info('Iniciando servidor local del visualizador...');
    const { url } = await startUiServer({
        projectRoot: root,
        port,
        openBrowser,
    });
    Logger.success(`Servidor del visualizador activo en: ${url}`);
    if (openBrowser) {
        Logger.info('Abriendo navegador predeterminado...');
    }
    console.log('\n💡 Dashboard interactivo disponible. Presiona Ctrl+C para detener el servidor.\n');
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
        case 'ui':
        case 'view':
        case 'dashboard':
            await handleUi();
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
//# sourceMappingURL=cli.js.map