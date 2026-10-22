# PLAN-006: Plan Técnico para la Ejecución Segura de `sdd run`

- **Estado:** APPROVED
- **Especificación Asociada:** [SPEC-006](../specs/SPEC-006-SAFE-RUN.md)
- **Nivel de Severidad:** L3
- **Fecha:** 2026-10-22
- **Entrega:** PR 2 (puntos 🔴 3, 🔴 4, 🟠 11, 🟠 12 y 🟡 17 del feedback). **Depende del PR 1**: reutiliza `src/utils/text-file.ts` y `src/utils/prompt.ts`.

---

## 1. Visión General de la Arquitectura

`sdd run` pasa de "ejecutar y luego limpiar con fuerza bruta" a un flujo en cuatro fases. Las operaciones git se calculan sobre rutas concretas, nunca sobre el repositorio entero:

```
 tasks.md ──► 1. PREPARAR ─────────► 2. MOSTRAR ─────────► 3. EJECUTAR ───────────► 4. GUARDAR
              parsear tareas         plan de comandos      por tarea:               tasks.md con
              + archivos declarados  y operaciones git     verificar (shell)        su BOM y EOL
              git status (-z)        --dry-run: salir      OK  → [x] (+ commit      originales
              propias / ajenas       sin TTY ni --yes:          acotado si --commit)
              guardas REQ 02/03/05   abortar               KO  → BLOCKED (+ rollback
                                     TTY: confirmar             acotado si --rollback)
```

### 1.1 Modelo de propiedad de rutas (decisión aprobada en SPEC-006, §4)

| Conjunto | Definición |
| :--- | :--- |
| `declaradas(T)` | Rutas válidas de `Archivos a Modificar / Crear` de la tarea T, normalizadas con `/`. |
| `propias` | Unión de `declaradas(T)` de todas las tareas **pendientes**. |
| `sucias` | Salida de `git status --porcelain=v1 -z --untracked-files=all`. Los archivos ignorados no aparecen. |
| `ajenas` | `sucias − propias − {el propio tasks.md}`. Si no está vacío y falta `--allow-dirty`, se aborta (REQ-RUN-03). |
| `protegidas` | `ajenas` cuando hay `--allow-dirty`. Nunca se preparan ni se restauran (REQ-RUN-04). |

- **Rutas en Windows:** se comparan sin distinguir mayúsculas.
- **El `tasks.md` que se ejecuta:** queda fuera de la comprobación de ajenas. Nunca se prepara ni se restaura; solo se reescribe al final.

### 1.2 Operaciones git por caso

| Caso | Operación | Nunca |
| :--- | :--- | :--- |
| Commit (`--commit` o `autoCommit: true`) | `git add -- <declaradas ∩ sucias − protegidas>` y después `git commit -m <mensaje> --only -- <mismas rutas>`. `--only` evita arrastrar lo que el usuario ya tenía preparado en otras rutas. | `add -A`, `push` |
| Rollback (`--rollback` + confirmación), estado `??` | Borrar el archivo. | `git clean` |
| Rollback, estado `A` (alta preparada) | `git rm --cached -q -- <ruta>` y borrar el archivo. | `reset --hard` |
| Rollback, resto de estados (`M`, `D`, `R`…) | `git restore --source=HEAD --staged --worktree -- <rutas>` | |
| Rama de trabajo | `git check-ref-format --branch <n>` → `git rev-parse --verify --quiet refs/heads/<n>` (si existe, error) → `git switch -c <n>` | `checkout -B` |

- **Rutas compartidas:** el rollback omite, con aviso, las rutas que también declara otra tarea pendiente.
- **Renombrados:** se tratan como baja del origen más alta del destino.

| Componente | Archivo | Responsabilidad | Requisitos |
| :--- | :--- | :--- | :--- |
| Cliente git | `src/utils/git-client.ts` (reescrito) | `execFile('git', args)`, `GitError` con operación y stderr, parseo de `status -z`, `addPaths`, `commitPaths`, `restorePaths`, `removeFromIndex`, `createBranch`. | REQ-RUN-16, 17, 18, 19 |
| Markdown de tareas | `src/core/task-markdown.ts` (nuevo) | Parseo con `files`; actualización de casillas que conserva separadores de línea y BOM. | REQ-RUN-01, 20 |
| Rutas de tareas | `src/core/task-paths.ts` (nuevo) | `validateDeclaredPath`, cálculo de propias, ajenas y protegidas. | REQ-RUN-02, 03, 04 |
| Ejecutor | `src/core/command-executor.ts` (nuevo) | `spawn(cmd, { shell: true })` que devuelve `{ code, output }`; `findMissingExecutable`: en Windows resuelve antes el primer ejecutable; en sh usa el código 127 (ver §8). | REQ-RUN-07 |
| Motor | `src/core/auto-runner.ts` | Bucle por tarea: guardas, verificación, commit o rollback acotados. Sin `npm test` por defecto. | REQ-RUN-06, 11–15 |
| Orquestación | `src/core/run-command.ts` (nuevo) | Preparar, mostrar, `--dry-run`, TTY y `--yes`, confirmar, ejecutar, guardar. Recibe `CliIO`. | REQ-RUN-05, 08, 09, 10 |
| Configuración | `src/core/config.ts` | `autonomous.autoCommit` (`false`) y `autonomous.commitMessageTemplate`. | REQ-RUN-13, 15 |
| Plantilla | `src/core/scaffold.ts` | `buildTasksTemplate(autoCommit)` para la regla 5. | REQ-RUN-21 |
| CLI | `src/cli.ts` | `handleRun` delega en `runTasksCommand`; parámetros `--yes`, `--dry-run`, `--allow-dirty`, `--rollback` y `--commit`; ayuda actualizada. | Todos |

---

## 2. Contratos de Datos e Interfaces

```typescript
// src/utils/git-client.ts
export type GitRunner = (args: string[], cwd: string) => Promise<{ code: number; stdout: string; stderr: string }>;
export class GitError extends Error { constructor(readonly args: string[], readonly code: number, readonly stderr: string) }
export interface PathStatus { path: string; origPath?: string; index: string; worktree: string; }
export class GitClient {
  constructor(cwd?: string, runner?: GitRunner);                 // runner por defecto: execFile, sin shell
  status(): Promise<PathStatus[]>;                                // lanza GitError: nunca asume "limpio"
  addPaths(paths: string[]): Promise<void>;
  commitPaths(message: string, paths: string[]): Promise<void>;  // commit -m <msg> --only -- <paths>
  restorePaths(paths: string[]): Promise<void>;
  removeFromIndex(paths: string[]): Promise<void>;
  createBranch(name: string): Promise<void>;
}

// src/core/task-markdown.ts
export interface MicroTask {
  id: string; title: string; reqId?: string; status: TaskStatus;
  verifyCommand?: string; files: string[]; line: number;          // files: nuevo
}
export function parseTasksMarkdown(content: string): MicroTask[];
export function updateTaskStatusInMarkdown(content: string, taskId: string, status: TaskStatus): string;

// src/core/task-paths.ts
export type PathCheck = { ok: true; path: string } | { ok: false; reason: string };
export function validateDeclaredPath(raw: string): PathCheck;
export interface Ownership { owned: Set<string>; foreign: string[]; invalid: Array<{ taskId: string; path: string; reason: string }>; }
export function computeOwnership(pending: MicroTask[], dirty: PathStatus[], tasksFile: string): Ownership;

// src/core/command-executor.ts
export type CommandExecutor = (cmd: string, cwd: string) => Promise<{ code: number; output: string }>;
export const shellExecutor: CommandExecutor;
// win32: devuelve el primer ejecutable si no es interno de cmd y `where` (execFile) no lo encuentra,
// o si es una ruta que no existe; en el resto de plataformas devuelve undefined y se usa el código 127.
export async function findMissingExecutable(cmd: string, cwd: string): Promise<string | undefined>;
export function isShellNotFoundCode(code: number): boolean;    // 127 (sh)

// src/core/auto-runner.ts
export interface RunnerOptions {
  cwd?: string; maxRetries?: number; executor?: CommandExecutor; git?: GitClient;
  allowDirty?: boolean; rollback?: boolean; commit?: boolean;
  commitMessageTemplate?: string; tasksFile?: string;
  confirmRollback?: (paths: string[]) => Promise<boolean>;
}
export function formatCommitMessage(template: string, task: MicroTask): string; // {reqId} {taskId} {title}

// src/core/run-command.ts
export interface RunCommandOptions extends RunnerOptions { tasksFile: string; yes: boolean; dryRun: boolean; io: CliIO; }
export interface RunPreflight { pending: MicroTask[]; ownership: Ownership; gitAvailable: boolean; gitError?: string; }
export async function buildRunPreflight(markdown: string, options: RunCommandOptions): Promise<RunPreflight>;
export function describeRun(preflight: RunPreflight, options: RunCommandOptions): string;
export async function runTasksCommand(options: RunCommandOptions): Promise<{ exitCode: number; result?: AutoRunResult }>;
```

**Orden de `runTasksCommand`:**
1. Leer `tasks.md` con `decodeText` y preparar el preflight.
2. Si git no responde y falta `--allow-dirty` → salir con 1 (REQ-RUN-05). Con `--allow-dirty`, se desactivan commit y rollback y se avisa.
3. Si hay rutas ajenas y falta `--allow-dirty` → salir con 1 y listarlas (REQ-RUN-03).
4. Mostrar `describeRun`: tareas, comandos, operaciones git, rutas inválidas.
5. Con `--dry-run` → salir con 0 sin ejecutar nada (REQ-RUN-10).
6. Sin `--yes` y sin TTY → salir con 1 (REQ-RUN-09). Sin `--yes` en TTY → preguntar; con `n`, salir con 0 (REQ-RUN-08).
7. `executeAutonomousPlan`. Con `--yes`, `confirmRollback` responde que sí; sin él, pregunta.
8. Guardar `tasks.md` con `encodeText` (REQ-RUN-20) y salir con 0 o 1.

**Bucle por tarea (`executeAutonomousPlan`):**
1. Si tiene rutas inválidas → BLOCKED (REQ-RUN-02).
2. Si no tiene `Verificación` → BLOCKED (REQ-RUN-06).
3. En Windows, comprobar antes que el ejecutable existe. Verificar hasta `maxRetries` veces; con el código 127 de sh, cortar sin reintentar (REQ-RUN-07, §8).
4. Si pasa → marcar `[x]` y, si el commit está activo, commit acotado (REQ-RUN-14, 15).
5. Si falla → BLOCKED y, si el rollback está activo y confirmado, rollback acotado (REQ-RUN-12). Detener.
6. Un `GitError` detiene la ejecución con la operación y su stderr (REQ-RUN-17).

**Configuración nueva:** `autonomous.autoCommit: false` y `autonomous.commitMessageTemplate: "feat({reqId}): {taskId} {title}"`. Si la tarea no tiene `reqId`, se usa `SDD`.

---

## 3. Estrategia de Testing y Verificación

Las pruebas de integración crean un repositorio git temporal (`fs.mkdtemp` + `git init`) con configuración local propia: `user.name`, `user.email` y `commit.gpgsign=false`, solo para ese repositorio de prueba. El ejecutor de comandos se inyecta, y un `GitRunner` espía envuelve el real para registrar cada invocación.

| Requisito | Prueba | Archivo |
| :--- | :--- | :--- |
| REQ-RUN-01 | Parseo de `Archivos a Modificar / Crear` con rutas entre comillas invertidas y barras `\`. | `tests/task-markdown.test.ts` |
| REQ-RUN-02 | `../fuera.txt`, `C:\x`, `/etc/x`, `.git/config` → BLOCKED y ejecutor sin llamadas. | `tests/task-paths.test.ts`, `tests/auto-runner.test.ts` |
| REQ-RUN-03 | `notas.txt` sin seguimiento y sin declarar → código 1, listado y ejecutor sin llamadas. | `tests/run-command.test.ts` |
| REQ-RUN-04 | `--allow-dirty --rollback --commit`: archivo sin seguimiento y `Global.asax.cs` ajenos intactos y fuera del commit. | `tests/auto-runner.test.ts` |
| REQ-RUN-05 | Directorio sin `.git` → código 1 con el error de git. | `tests/run-command.test.ts` |
| REQ-RUN-06 | Tarea sin `Verificación` → BLOCKED y ejecutor sin llamadas. | `tests/auto-runner.test.ts` |
| REQ-RUN-07 | Ejecutor que devuelve 127 → un único intento. En Windows, `comando-inexistente-xyz` se detecta antes de ejecutarlo; `echo`, `msbuild` (si existe) y `.\build.bat` (si existe) no se marcan. | `tests/auto-runner.test.ts`, `tests/command-executor.test.ts` |
| REQ-RUN-08 | `CliIO` con TTY que responde `n` → ejecutor sin llamadas y `tasks.md` intacto. | `tests/run-command.test.ts` |
| REQ-RUN-09 | `CliIO` sin TTY y sin `--yes` → código 1. | `tests/run-command.test.ts` |
| REQ-RUN-10 | `--dry-run` → ejecutor sin llamadas y hash del directorio idéntico. | `tests/run-command.test.ts` |
| REQ-RUN-11 | Fallo sin `--rollback`: `git status` solo cambia en `tasks.md`. | `tests/auto-runner.test.ts` |
| REQ-RUN-12 | `A.cs` vuelve a HEAD, `B.cs` se borra, `C.cs` intacto; el espía no registra `clean` ni `reset`. | `tests/auto-runner.test.ts` |
| REQ-RUN-13 | Configuración por defecto y tarea OK → HEAD igual e índice vacío; el espía no registra `add` ni `commit`. | `tests/auto-runner.test.ts` |
| REQ-RUN-14 | Commit con solo `A.cs`; `C.cs`, preparado de antemano, sigue preparado y fuera del commit. | `tests/auto-runner.test.ts` |
| REQ-RUN-15 | Plantilla `[{taskId}] {title}` → `[TASK-7] Alta de cliente`. | `tests/auto-runner.test.ts` |
| REQ-RUN-16 | `reqId` con `$(touch pwned)` y `" & echo x > pwned2 & "` → sin archivos creados y mensaje literal. | `tests/git-client.test.ts` |
| REQ-RUN-17 | Hook `pre-commit` que sale con 1 → código 1 y stderr del hook en la salida. | `tests/auto-runner.test.ts` |
| REQ-RUN-18 | Ejecución completa con `--commit`: el espía no registra `push`, `fetch`, `pull` ni `remote`. | `tests/auto-runner.test.ts` |
| REQ-RUN-19 | `createBranch` sobre una rama existente → error y la rama apunta al mismo commit. | `tests/git-client.test.ts` |
| REQ-RUN-20 | `tasks.md` con BOM y CRLF → solo cambian los bytes de la casilla. | `tests/task-markdown.test.ts` |
| REQ-RUN-21 | `init` por defecto → la regla 5 menciona la autorización humana. | `tests/scaffold.test.ts` |

- **Comando de verificación de cada tarea:** `npm run lint && npm test`.
- **Cierre del PR:** `npm run build` y `node dist/cli.js review src` con puntuación ≥ 85.
- El CI (`ubuntu-latest`) ya trae git. Las pruebas que dependen de la shell usan la expectativa de cada plataforma: código 127 en sh y resolución previa en Windows.

---

## 4. Riesgos Técnicos y Mitigaciones

| Riesgo Técnico Identificado | Probabilidad / Impacto | Estrategia de Mitigación |
| :--- | :--- | :--- |
| Cambios que el usuario ya tenía preparados en rutas protegidas acaban en el commit. | Media / Alto | `git commit --only -- <rutas>` confirma solo esas rutas. Prueba REQ-RUN-14. |
| Mayúsculas y minúsculas distintas entre lo declarado y `git status` en Windows. | Media / Medio | Comparación sin distinguir mayúsculas en `win32`. Prueba específica. |
| Archivos nuevos dentro de carpetas sin seguimiento no aparecen uno a uno. | Alta / Medio | `--untracked-files=all`. |
| Un flujo de agente que edita `.sdd/` (specs, plan) durante la tarea queda como cambio ajeno y aborta. | Media / Bajo | El mensaje de aborto sugiere declarar la ruta o usar `--allow-dirty`. Se documenta en el README. |
| Los usuarios de la 1.x esperan un commit por tarea. | Cierta / Medio | Versión mayor (2.0.0), CHANGELOG y la regla 5 de la plantilla actualizada. |
| Firma de commits o hooks del repositorio del usuario hacen fallar el commit. | Media / Bajo | Se informa el error (REQ-RUN-17). SDD no desactiva hooks ni firma. |
| Salida muy grande del comando de verificación. | Baja / Bajo | `spawn` lee por streams; el motivo guardado se trunca a 2.000 caracteres. |

---

## 5. Cambios en la API Pública (aprobados el 2026-10-22, constitución §1.3)

- **Eliminados:**
  - `GitClient.getStatus`, `GitClient.createOrCheckoutBranch`, `GitClient.commit(message)` y `GitClient.resetHardAndClean`;
  - la interfaz `GitStatus`;
  - `RunnerOptions.skipCommit` y `RunnerOptions.featureBranch`.
- **Modificados:**
  - `MicroTask` añade `files`;
  - `runTaskVerification` devuelve también `code`;
  - `SddConfig.autonomous` añade `autoCommit` y `commitMessageTemplate`;
  - `BUILTIN_TEMPLATES.tasks` pasa a ser la versión con `autoCommit: false`.
- **Nuevas exportaciones:** `GitError`, `PathStatus`, `validateDeclaredPath`, `computeOwnership`, `shellExecutor`, `findMissingExecutable`, `isShellNotFoundCode`, `formatCommitMessage`, `buildRunPreflight`, `describeRun`, `runTasksCommand`, `buildTasksTemplate`.
- **Compatibilidad:** `parseTasksMarkdown` y `updateTaskStatusInMarkdown` se mueven a `task-markdown.ts`, y `auto-runner.ts` los reexporta.

---

## 6. Enmienda de la Constitución (aprobada el 2026-10-22)

En la §3.2 de la constitución de este repositorio, que tras el PR 1 vivirá en `.sdd/constitution.md`, se sustituyen los dos últimos puntos por:

> - If verification fails: Maximum of **3 automated correction cycles**. If failure persists, the agent must pause and output a blocking report detailing the root cause. Rollback is opt-in (`sdd run --rollback`), requires confirmation and is limited to the files declared by the task; `git reset --hard` and `git clean` are forbidden.
> - If verification passes: Mark `[x]` in `tasks.md` and advance to the subsequent task. Commits require explicit human authorization (`sdd run --commit` or `autonomous.autoCommit: true`), include only the files declared by the task (`feat(REQ-X): description`), and are never pushed.

---

## 7. Secuencia de Implementación (base para TASKS-006)

1. `git-client.ts` reescrito con sus pruebas (REQ-RUN-16, 17, 18, 19).
2. `task-markdown.ts`: archivos declarados y conservación de BOM y EOL (REQ-RUN-01, 20).
3. `task-paths.ts`: validación y propiedad de rutas (REQ-RUN-02, 03, 04).
4. `command-executor.ts` y la guarda de tarea sin verificación o comando inexistente (REQ-RUN-06, 07).
5. `auto-runner.ts`: éxito y commit acotado (REQ-RUN-13, 14, 15).
6. `auto-runner.ts`: fallo y rollback acotado (REQ-RUN-11, 12).
7. `run-command.ts`: preflight, `--dry-run`, TTY y confirmación (REQ-RUN-05, 08, 09, 10).
8. `config.ts`, `scaffold.ts` (regla 5) y `cli.ts`: parámetros y ayuda (REQ-RUN-21).
9. Enmienda de la constitución, sección «Qué comandos tocan git» del README, entrada `[Unreleased]` del CHANGELOG y regeneración de `.sdd/architecture-graph.md`.

---

## 8. Enmienda a SPEC-006 (REQ-RUN-07), aprobada y aplicada el 2026-10-22

**Evidencia (2026-10-22, Windows 11, Node 20):** `spawn('comando-inexistente-xyz --flag', { shell: true })` termina con el **código 1**, no con 9009. `cmd /c` solo deja 9009 en `%ERRORLEVEL%` dentro de la sesión, no como código de salida. En Windows, el código no distingue "comando no encontrado" de "comando que falla", y leer el mensaje de error no es fiable porque depende del idioma del sistema.

**Texto original (sustituido):**
> **SI** el comando de verificación termina con el código 127 (sh) o 9009 (cmd), **ENTONCES** el sistema **deberá** detener la tarea con el motivo "comando no encontrado" sin reintentarla.

**Texto vigente (aplicado en SPEC-006):**
> **SI** el ejecutable del comando de verificación no existe, porque termina con el código 127 en sh o porque en Windows su primer ejecutable no es un comando interno de cmd ni se resuelve con `where` o como ruta, **ENTONCES** el sistema **deberá** detener la tarea con el motivo "comando no encontrado" sin ejecutarla ni reintentarla.

**Criterio de aceptación vigente:**
- **DADO:** La tarea con `Verificación: comando-inexistente-xyz`.
- **CUANDO:** Se ejecuta `sdd run --yes` en Windows o en Linux.
- **ENTONCES:** La tarea queda BLOCKED con el motivo "comando no encontrado" y, en Windows, el comando no llega a lanzarse.

**Limitación conocida:** en Windows solo se comprueba el **primer** ejecutable. En `msbuild X.sln && herramienta-inexistente`, la segunda parte fallará como un error normal: se reintenta y acaba en BLOCKED con su salida.
