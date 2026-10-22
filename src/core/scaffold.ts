import fs from 'node:fs/promises';
import path from 'node:path';
import { SeverityLevel, SddConfig, loadConfig, mergeConfig, readConfigFile } from './config.js';
import { SupportedBridge, CONSTITUTION_PATH, planBridgeSync, resolveConstitution, bridgeRelPath } from './bridges.js';
import { ApplyReport, FileChange, FilePlan, applyFilePlan, createBackupStamp } from './file-plan.js';
import { scanProject, generateReverseConstitution, generateReverseBaselineSpec } from './reverse-engine.js';
import { ensureDir, fileExists } from '../utils/fs-helpers.js';
import { decodeText, encodeText, toEol, InvalidEncodingError } from '../utils/text-file.js';

/**
 * `severity`, `bridges`, `locale` y `graphEngine` son opcionales: si no se pasan, se conserva el valor
 * de `.sdd/config.json` o, en un proyecto nuevo, el valor por defecto.
 */
export interface ScaffoldOptions {
  projectRoot: string;
  projectName?: string;
  mode: 'greenfield' | 'brownfield';
  severity?: SeverityLevel;
  bridges?: SupportedBridge[];
  includeSkills: boolean;
  locale?: 'en' | 'es';
  graphEngine?: 'builtin' | 'graphify' | 'hybrid';
}

export interface ScaffoldResult {
  createdFiles: string[];
  modifiedFiles: string[];
  createdDirs: string[];
  backups: string[];
  failed: Array<{ relPath: string; message: string; line?: number }>;
  mode: 'greenfield' | 'brownfield';
  severity: SeverityLevel;
  syncedBridges: string[];
  graphEngine: 'builtin' | 'graphify' | 'hybrid';
}

export const BUILTIN_TEMPLATES = {
  spec: `# SPEC-{{ID}}: {{TITULO}}

- **Estado:** DRAFT | IN_REVIEW | APPROVED | OBSOLETE
- **Fecha de Creación:** {{FECHA}}
- **Nivel de Severidad:** L1 (Velocity) | L2 (Standard) | L3 (Draconian)
- **Autor / Responsable:** {{AUTOR}}
- **Módulo / Dominio:** {{DOMINIO}}

---

## 1. Contexto y Justificación (El "Por Qué")
<!-- Describe brevemente el problema de negocio o técnico que resuelve esta especificación y por qué es necesario implementarlo ahora. -->

---

## 2. Requerimientos del Sistema (Notación EARS)

### REQ-{{ID}}-01: [Nombre del Requerimiento]
- **Tipo EARS:** Ubicuo | Event-driven | State-driven | Unwanted Behavior | Optional
- **Declaración:**
  > [Escribe la declaración siguiendo el patrón EARS correspondiente]
- **Criterio de Aceptación:**
  - **DADO:** [Estado inicial]
  - **CUANDO:** [Acción]
  - **ENTONCES:** [Resultado observable]

### REQ-{{ID}}-02: [Casos de Error y Recuperación]
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > SI [error o fallo], ENTONCES el sistema deberá [recuperación/mensaje].
- **Criterio de Aceptación:**
  - **DADO:** [Condición anómala]
  - **CUANDO:** [Ocurre el fallo]
  - **ENTONCES:** [Resultado seguro esperado]

---

## 3. Límites y Restricciones (Out of Scope & Constraints)
- **Fuera de Alcance:**
  - [Qué NO se va a construir en esta iteración]
- **Restricciones Técnicas / Invariantes:**
  - [Rendimiento, compatibilidad, dependencias prohibidas]

---

## 4. Registro de Clarificación y Validación (El Árbitro)
<!-- Registro de preguntas incómodas respondidas en la fase de clarificación -->
| Pregunta / Caso Límite Evaluado | Decisión Tomada | Impacto en la Spec |
| :--- | :--- | :--- |
| ¿Qué ocurre si falla la conexión a mitad de proceso? | Se implementará cola idempotente con rollback local. | Cubierto en REQ-{{ID}}-02 |
`,

  plan: `# PLAN-{{ID}}: Plan Técnico de Implementación para SPEC-{{ID}}

- **Estado:** DRAFT | IN_REVIEW | APPROVED
- **Especificación Asociada:** [SPEC-{{ID}}](./SPEC-{{ID}}.md)
- **Nivel de Severidad:** L1 | L2 | L3
- **Fecha:** {{FECHA}}

---

## 1. Visión General de la Arquitectura
<!-- Diagrama o descripción concisa de cómo interactúan los componentes técnicos involucrados -->

---

## 2. Contratos de Datos e Interfaces (Types / Schemas / APIs)
<!-- Define tipos TypeScript, interfaces, contratos OpenAPI o modelos de BD necesarios -->
\`\`\`typescript
// Ejemplo de interfaz
export interface EjemploContrato {
  id: string;
  timestamp: number;
}
\`\`\`

---

## 3. Estrategia de Testing y Verificación
- **Tests Unitarios:** [Qué funciones o módulos se probarán de forma aislada]
- **Tests de Integración:** [Qué flujos completos se verificarán]
- **Comandos de Ejecución:**
  - \`npm test\` o comando específico

---

## 4. Riesgos Técnicos y Mitigaciones
| Riesgo Técnico Identificado | Probabilidad / Impacto | Estrategia de Mitigación |
| :--- | :--- | :--- |
| Riesgo de rendimiento en listas grandes | Media / Alto | Paginación y virtualización en REQ-{{ID}}-01 |
`,

  tasks: `# TASKS-{{ID}}: Micro-Tareas de Implementación para SPEC-{{ID}}

- **Plan Asociado:** [PLAN-{{ID}}](./PLAN-{{ID}}.md)
- **Modo de Ejecución:** [ ] Supervisado (Paso a paso) | [ ] Autónomo Desatendido
- **Comando de Verificación General:** \`npm test\`

---

## Reglas de Ejecución para la IA:
1. Tomar una micro-tarea a la vez en orden secuencial.
2. Cada tarea debe completarse en ≤ 30 minutos de tiempo estimado.
3. Ejecutar el comando de verificación antes de marcar la casilla como completada (\`[x]\`).
4. Si la verificación falla: intentar auto-corrección hasta 3 veces. Si no pasa, detener y reportar.
5. Realizar un commit git semántico tras completar la tarea.

---

## Lista de Micro-Tareas

- [ ] **TASK-{{ID}}-001**: [Nombre descriptivo de la tarea]
  - **Requisito Asociado:** REQ-{{ID}}-01
  - **Archivos a Modificar / Crear:**
    - \`src/modulo/ejemplo.ts\`
    - \`tests/modulo/ejemplo.test.ts\`
  - **Criterio de Finalización:** [Condición observable y medible]
  - **Verificación:** \`npm test\`

- [ ] **TASK-{{ID}}-002**: [Siguiente micro-tarea]
  - **Requisito Asociado:** REQ-{{ID}}-02
  - **Archivos a Modificar / Crear:**
    - \`src/modulo/otro.ts\`
  - **Criterio de Finalización:** [Condición observable]
  - **Verificación:** \`npm test\`
`,

  earsGuide: `# Guía Rápida de Notación EARS (Easy Approach to Requirements Syntax)

La notación EARS elimina la ambigüedad en los requerimientos usando 5 patrones sintácticos estrictos:

| Tipo de Requisito | Patrón Sintáctico | Ejemplo |
| :--- | :--- | :--- |
| **Ubicuo (Ubiquitous)** | El sistema **deberá** [acción/capacidad]. | El sistema **deberá** almacenar todos los registros en formato UTF-8. |
| **Dirigido por Eventos (Event-driven)** | **CUANDO** [evento/disparador], el sistema **deberá** [respuesta]. | **CUANDO** el usuario presiona "Exportar", el sistema **deberá** generar un archivo PDF en < 2 segundos. |
| **Dirigido por Estado (State-driven)** | **MIENTRAS** [estado del sistema], el sistema **deberá** [comportamiento continuo]. | **MIENTRAS** el dispositivo esté sin conexión a Internet, el sistema **deberá** almacenar las transacciones en la cola local cifrada. |
| **Comportamiento No Deseado (Unwanted Behavior)** | **SI** [condición de error/excepción], **ENTONCES** el sistema **deberá** [respuesta de recuperación]. | **SI** la respuesta del servidor excede 5000 ms, **ENTONCES** el sistema **deberá** reintentar la petición hasta 3 veces con retroceso exponencial. |
| **Opcional (Optional Feature)** | **DONDE** [función habilitada o parámetro activo], el sistema **deberá** [capacidad]. | **DONDE** la autenticación biométrica esté soportada por el hardware, el sistema **deberá** ofrecer inicio de sesión por huella o rostro. |

---

## Estructura de Criterios de Aceptación (Given-When-Then / Gherkin)
Para cada requisito crítico, incluye al menos un escenario verificable:
- **DADO (Given):** El contexto o estado inicial previo a la acción.
- **CUANDO (When):** La acción ejecutada por el actor o sistema.
- **ENTONCES (Then):** El resultado observable esperado y verificable.
`,
};

export const BUILTIN_SKILLS: Record<string, string> = {
  'grill-me': `---
name: grill-me
description: Interrogatorio socrático implacable para desafiar especificaciones, detectar casos límite y alinear decisiones técnicas antes de programar.
---

# Grill-Me Skill: El Interrogador Implacable de Especificaciones

> **PROPÓSITO:** Este skill transforma al agente en un **Lead Architect / Inquisidor de Software**. Su objetivo es interrogar metódicamente al desarrollador sobre los supuestos, decisiones de arquitectura y casos borde de una funcionalidad **ANTES** de escribir una sola línea de código.

---

## 1. Reglas de Oro del Interrogatorio

1. **Prohibido asumir sin preguntar:** Si una especificación dice "manejar el error apropiadamente", la IA DEBE preguntar el comportamiento exacto.
2. **Auto-Grill Previo (Inspección del Código):** ANTES de hacer una pregunta, revisa el repositorio y el grafo de arquitectura. Todo lo que pueda deducirse del código debe auto-resolverse sin molestar al desarrollador.
3. **Preguntas con Respuestas Recomendadas:** Cada pregunta escalada al humano DEBE incluir opciones estructuradas y una opción sugerida con el prefijo \`(Recomendado)\`.
4. **Una decisión a la vez:** Presenta de 1 a 3 dilemas arquitectónicos clave por turno.
5. **Cero Complacencia Artificial (Anti-Sycophancy / Devil's Advocate):** La IA tiene prohibido aceptar ciegamente sugerencias que violen la constitución (\`AGENTS.md\`), rompan contratos existentes o creen vulnerabilidades.

---

## 2. Ejes de Ataque del Interrogador
- **Casos Límite y Datos Anómalos (Edge Cases)**
- **Modos de Fallo y Resiliencia (Failure Modes)**
- **Límites de Alcance (Scope Boundaries)**
- **Seguridad e Invariantes (Security Posture)**
- **Métricas Cuantitativas (SLAs en ms, límites de tamaño)**
`,

  'clean-code': `---
name: clean-code
description: Protocolo de auto-cuestionamiento, revisión de código limpio, erradicación de duplicación (DRY) y refactorización segura bajo pruebas.
---

# Clean Code & DRY Skill: El Árbitro de Calidad e Higiene de Código

> **PROPÓSITO:** Erradicar el código improvisado, la duplicación ciega (copy-paste) y la complejidad innecesaria mediante un pase reflexivo de **Auto-Cuestionamiento** antes de cada commit.

---

## 1. El Ciclo Red → Green → Refactor
1. **Fase Roja:** Escribe la prueba primero.
2. **Fase Verde:** Haz que la prueba pase con la implementación mínima.
3. **Fase de Auto-Cuestionamiento (Refactor):** Con los tests en verde, audita duplicación (DRY), nombres declarativos y complejidad ciclomática.

---

## 2. Criterios de Auto-Cuestionamiento
1. **[DRY]:** ¿Se repite alguna secuencia de lógica 2 o más veces? Extráela a módulo común.
2. **[Single Responsibility]:** ¿La función tiene más de 30 líneas o hace más de una cosa?
3. **[Nombres Declarativos]:** Sin abreviaturas crípticas ni comentarios obvios.
4. **[Guard Clauses]:** Evita anidación profunda (máx 2 niveles).
5. **[Tipado Estricto]:** Cero uso de \`any\` injustificado.
`,

  'project-graph': `---
name: project-graph
description: Generación y consulta de grafos de arquitectura y dependencias para optimizar contexto y reducir el consumo de tokens en agentes de IA.
---

# Project-Graph Skill: Navegación de Código Basada en Grafos y Ahorro de Tokens

> **PROPÓSITO:** En lugar de saturar la ventana de contexto de la IA cargando decenas de archivos de código completos, consulta un **Grafo Semántico Ultracompacto** de la arquitectura.

---

## 1. Principio de Contexto Mínimo Necesario
- Consulta primero \`.sdd/architecture-graph.md\` o \`.sdd/context-graph.json\`.
- Sigue las dependencias entre módulos para conocer el impacto de un cambio.
- Reduce en un **80% a 95%** el consumo de tokens en prompts.
`,

  'sdd-methodology': `---
name: sdd-methodology
description: Metodología Spec-Driven Development (SDD), notación EARS, supervisión con diferentes severidades (L1, L2, L3) y ejecución autónoma verificable.
---

# SDD Methodology Skill: El Árbitro y Supervisor de Software

> **PROPÓSITO:** Metodología oficial de Spec-Driven Development (SDD) para agentes autónomos.

---

## 1. Los 3 Roles del Árbitro
- **El Inquisidor:** Formula preguntas socráticas de estrés sobre casos límite antes de programar.
- **El Arquitecto:** Valida viabilidad técnica, contratos tipados y descomposición en micro-tareas (≤ 30 min).
- **El Auditor:** Valida que no haya alucinaciones de alcance y que todas las pruebas pasen en verde.
`,

  'graphify': `---
name: graphify
description: Extracción y análisis de grafos forenses de llamadas de bajo nivel intra-función para auditorías profundas y código legado.
---

# Graphify Skill: Mapeo Forense y Rastreo de Llamadas Intra-Función

> **PROPÓSITO:** Inspección de código a nivel microscópico para rastrear llamadas entre funciones internas, métodos privados y dependencias profundas antes de realizar refactorizaciones críticas o depuración.

---

## 1. ¿Cuándo Utilizar Graphify vs Project-Graph?
- **Usa Project-Graph (Nativo de SDD):** Para planificar, entender contratos públicos, interfaces exportadas y mantener tokens al mínimo (< 600 tokens).
- **Usa Graphify:** Para bases de código legado masivas sin tipado o rastreo de llamadas función a función de bajo nivel.

---

## 2. Integración con SDD
- SDD detecta automáticamente archivos \`graph.html\`, \`graph.json\` o \`.graphify/graph.json\` generados por Graphify y los enlaza en \`.sdd/architecture-graph.md\`.
`,
};

export function generateStandardConstitution(projectName: string, severity: SeverityLevel): string {
  return `# Constitución del Proyecto: ${projectName}

> **PROPÓSITO:** Esta constitución establece las directrices innegociables y principios arquitectónicos para el desarrollo de software en este proyecto. Cualquier agente de Inteligencia Artificial que opere en este repositorio DEBE acatar estrictamente estas reglas.

---

## 1. Principio Fundamental: La Especificación es la Fuente de Verdad

1. **Prohibido el Vibe Coding:** Ninguna línea de código de producción será generada sin un requisito previo (\`REQ-ID\`) documentado en una especificación aprobada y una micro-tarea asignada en \`tasks.md\`.
2. **Determinismo sobre Intuición:** Ante la duda entre dos enfoques técnicos, siempre se preferirá aquel que sea medible, testeable y alineado con los requerimientos EARS.
3. **Inmutabilidad del Alcance en Ejecución:** Una vez aprobados la especificación y el plan, el agente de IA **NO TIENE PERMITIDO** modificar el alcance, agregar librerías no planificadas o alterar firmas de contratos públicos sin intervención humana explícita.
4. **Prohibición de Complacencia Artificial (Anti-Sycophancy / Devil's Advocate):** La IA tiene terminantemente prohibido actuar como un complaciente ("yes-man"). Si el líder técnico o desarrollador formula una instrucción que contradice las reglas del proyecto, rompe contratos previos (\`SPEC-000-BASELINE.md\`) o introduce riesgos de seguridad (OWASP), el Árbitro DEBE emitir una advertencia explícita sobre el conflicto y solicitar confirmación consciente antes de avanzar.
5. **Auto-Grill Mandatorio de la IA (Filtro Previo de Ruido):** Antes de interrogar al líder técnico humano, la IA DEBE auto-cuestionar su propio diseño inspeccionando el repositorio y el grafo. Todo lo que pueda deducirse del código existente debe auto-resolverse; solo los dilemas genuinos de negocio, seguridad o arquitectura deben escalarse al humano, acompañados siempre de una solución sugerida con \`(Recomendado)\`.

---

## 2. Severidad Configurada del Árbitro: ${severity}
- **L1 (Pragmatic / Velocity):** Sugerencias no bloqueantes. Ideal para prototipado rápido.
- **L2 (Standard / Producción):** EARS obligatorio, 100% tareas con tests y comandos de verificación ejecutables.
- **L3 (Draconian / Misión Crítica):** Cero tolerancia a ambigüedades, modelado formal de fallos y resiliencia.

---

## 3. Protocolo de Ejecución
1. Redactar \`spec.md\` con \`sdd new-spec <nombre>\`.
2. Clarificar con el árbitro usando \`sdd grill <spec.md>\`.
3. Diseñar arquitectura en \`plan.md\` y micro-tareas en \`tasks.md\`.
4. Ejecutar con verificación mediante \`sdd run <tasks.md>\`.
`;
}

const SCAFFOLD_DIRS = ['.sdd/specs', '.sdd/plans', '.sdd/tasks', '.sdd/templates'];
const CONFIG_PATH = '.sdd/config.json';
const BASELINE_SPEC_PATH = '.sdd/specs/SPEC-000-BASELINE.md';

const TEMPLATE_FILES: Record<string, string> = {
  'spec.template.md': BUILTIN_TEMPLATES.spec,
  'plan.template.md': BUILTIN_TEMPLATES.plan,
  'tasks.template.md': BUILTIN_TEMPLATES.tasks,
  'ears-guide.md': BUILTIN_TEMPLATES.earsGuide,
};

function utf8(text: string): Buffer {
  return Buffer.from(text, 'utf-8');
}

async function planCreateIfMissing(root: string, relPath: string, content: () => string): Promise<FileChange[]> {
  if (await fileExists(path.join(root, relPath))) return [];
  return [{ kind: 'create', relPath, after: utf8(content()) }];
}

/**
 * Archivos que SDD genera enteros (skills, config.json): se crean o se actualizan conservando
 * el BOM y el fin de línea del archivo existente.
 */
async function planGeneratedFile(root: string, relPath: string, generated: string, backup: boolean): Promise<FileChange[]> {
  const filePath = path.join(root, relPath);
  if (!(await fileExists(filePath))) return [{ kind: 'create', relPath, after: utf8(generated) }];

  const before = await fs.readFile(filePath);
  try {
    const content = decodeText(before, relPath);
    const after = encodeText({ ...content, text: toEol(generated, content.eol) });
    return after.equals(before) ? [] : [{ kind: 'modify', relPath, before, after, backup }];
  } catch (err) {
    if (err instanceof InvalidEncodingError) return [{ kind: 'error', relPath, message: err.message }];
    throw err;
  }
}

async function planTemplates(root: string): Promise<FileChange[]> {
  const changes: FileChange[] = [];
  for (const [filename, content] of Object.entries(TEMPLATE_FILES)) {
    // Una plantilla que el equipo ya tiene (quizá editada) se conserva (REQ-BRIDGE-12).
    changes.push(...(await planCreateIfMissing(root, `.sdd/templates/${filename}`, () => content)));
  }
  return changes;
}

async function planSkills(root: string): Promise<FileChange[]> {
  const changes: FileChange[] = [];
  for (const [skillName, content] of Object.entries(BUILTIN_SKILLS)) {
    changes.push(...(await planGeneratedFile(root, `.agents/skills/${skillName}/SKILL.md`, content, true)));
  }
  return changes;
}

/**
 * Fusiona la configuración existente con la de este `init`: solo los valores pasados explícitamente
 * sustituyen a los que ya había, y se añaden las claves nuevas con su valor por defecto (REQ-BRIDGE-12).
 */
async function resolveScaffoldConfig(options: ScaffoldOptions): Promise<SddConfig> {
  const existing = await readConfigFile(options.projectRoot);
  return mergeConfig(existing, {
    projectName: options.projectName ?? existing?.projectName ?? path.basename(options.projectRoot),
    severity: options.severity,
    locale: options.locale,
    projectType: options.mode,
    bridges: options.bridges,
    graph: { engine: options.graphEngine },
  });
}

interface ConstitutionPlan {
  changes: FileChange[];
  pendingText?: string;
}

/**
 * La constitución va a `.sdd/constitution.md` y solo se genera si no hay ninguna: ni ese archivo
 * ni una constitución 1.x en `AGENTS.md`, que migra el plan de puentes (REQ-BRIDGE-01, REQ-BRIDGE-11).
 */
async function planConstitution(root: string, mode: ScaffoldOptions['mode'], config: SddConfig): Promise<ConstitutionPlan> {
  const scan = mode === 'brownfield' ? await scanProject(root) : null;
  const baseline = scan ? await planCreateIfMissing(root, BASELINE_SPEC_PATH, () => generateReverseBaselineSpec(scan)) : [];
  if ((await resolveConstitution(root)) !== null) return { changes: baseline };

  const text = scan ? generateReverseConstitution(scan) : generateStandardConstitution(config.projectName, config.severity);
  return { changes: [...baseline, { kind: 'create', relPath: CONSTITUTION_PATH, after: utf8(text) }], pendingText: text };
}

async function buildScaffoldPlan(options: ScaffoldOptions): Promise<{ plan: FilePlan; config: SddConfig }> {
  const root = options.projectRoot;
  const config = await resolveScaffoldConfig(options);
  const constitution = await planConstitution(root, options.mode, config);
  const bridges = await planBridgeSync(root, config.bridges, constitution.pendingText);

  const changes: FileChange[] = [
    ...(await planTemplates(root)),
    ...(options.includeSkills ? await planSkills(root) : []),
    ...(await planGeneratedFile(root, CONFIG_PATH, JSON.stringify(config, null, 2), false)),
    ...constitution.changes,
    ...bridges.changes,
  ];
  return { plan: { changes, warnings: bridges.warnings }, config };
}

/**
 * Calcula, sin escribir nada, todo lo que haría `sdd init`: es la base de `--dry-run` (REQ-BRIDGE-08).
 */
export async function planScaffold(options: ScaffoldOptions): Promise<FilePlan> {
  return (await buildScaffoldPlan(options)).plan;
}

/**
 * Plan de `sdd reverse`: línea base y constitución inversa (solo si faltan) y los puentes de `config.bridges`.
 */
export async function planReverse(projectRoot: string): Promise<FilePlan> {
  const config = await loadConfig(projectRoot);
  const constitution = await planConstitution(projectRoot, 'brownfield', config);
  const bridges = await planBridgeSync(projectRoot, config.bridges, constitution.pendingText);
  return { changes: [...constitution.changes, ...bridges.changes], warnings: bridges.warnings };
}

function scaffoldDirsOf(projectRoot: string): string[] {
  return SCAFFOLD_DIRS.map((dir) => path.join(projectRoot, dir));
}

/**
 * Las carpetas vacías no forman parte del plan de archivos: se crean después de aplicarlo.
 */
export async function ensureScaffoldDirs(projectRoot: string): Promise<string[]> {
  const dirs = scaffoldDirsOf(projectRoot);
  for (const dir of dirs) await ensureDir(dir);
  return dirs;
}

function summarizeScaffold(options: ScaffoldOptions, config: SddConfig, plan: FilePlan, report: ApplyReport): ScaffoldResult {
  const written = new Set(report.written);
  const failedPaths = new Set(report.errors.map((error) => error.relPath));
  const pathsOf = (kind: FileChange['kind']) =>
    plan.changes
      .filter((change) => change.kind === kind && written.has(change.relPath))
      .map((change) => path.join(options.projectRoot, change.relPath));

  return {
    createdFiles: pathsOf('create'),
    modifiedFiles: pathsOf('modify'),
    createdDirs: scaffoldDirsOf(options.projectRoot),
    backups: report.backups,
    failed: report.errors.map(({ relPath, message, line }) => ({ relPath, message, line })),
    mode: options.mode,
    severity: config.severity,
    syncedBridges: config.bridges.filter((bridge) => {
      const relPath = bridgeRelPath(bridge);
      return relPath !== undefined && !failedPaths.has(relPath);
    }),
    graphEngine: config.graph.engine,
  };
}

/**
 * Orquestador de `sdd init`: calcula el plan de archivos y lo aplica (con respaldos) de una vez.
 */
export async function scaffoldProject(options: ScaffoldOptions): Promise<ScaffoldResult> {
  const { plan, config } = await buildScaffoldPlan(options);
  const report = await applyFilePlan(plan, options.projectRoot, createBackupStamp());
  await ensureScaffoldDirs(options.projectRoot);
  return summarizeScaffold(options, config, plan, report);
}
