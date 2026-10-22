# TASKS-006: Micro-Tareas para la Ejecución Segura de `sdd run`

- **Plan Asociado:** [PLAN-006](../plans/PLAN-006-SAFE-RUN.md)
- **Especificación:** [SPEC-006](../specs/SPEC-006-SAFE-RUN.md)
- **Estado:** APPROVED
- **Modo de Ejecución:** Supervisado (paso a paso)
- **Comando de Verificación General:** `npm run lint && npm test`
- **Precondición:** el PR 1 (TASKS-005) está fusionado. Se reutilizan `src/utils/text-file.ts` y `src/utils/prompt.ts`.

---

## Reglas de Ejecución

1. Una micro-tarea a la vez, en orden. Cada una está estimada en ≤ 30 minutos.
2. Primero la prueba (rojo), después el código mínimo (verde) y por último el repaso de SRP y DRY (refactor).
3. Ejecutar el comando de verificación antes de marcar `[x]`. Si falla tres veces, detenerse y redactar un informe de bloqueo.
4. **Sin commits ni push sin autorización humana explícita.** Cada commit, cuando se autorice, sigue el formato `feat(REQ-X): descripción`.
5. **No ejecutar este archivo con `sdd run` de la versión 1.x:** esa versión hace `git add -A` y, ante fallos, `git reset --hard` + `git clean -fd`.
6. Las pruebas de integración crean repositorios git temporales (`fs.mkdtemp` + `git init`) con `user.name`, `user.email` y `commit.gpgsign=false` configurados solo en ese repositorio de prueba. Ninguna prueba usa `process.cwd()` como repositorio.

---

## Lista de Micro-Tareas

- [ ] **TASK-006-001**: Reescribir el núcleo de `git-client.ts`: `GitRunner` por defecto con `execFile('git', args)`, `GitError` y `status()` con parseo de `--porcelain=v1 -z --untracked-files=all`.
  - **Requisito Asociado:** REQ-RUN-16, REQ-RUN-17
  - **Archivos a Modificar / Crear:**
    - `src/utils/git-client.ts`
    - `tests/git-client.test.ts`
  - **Criterio de Finalización:**
    - `status()` devuelve `M`, `A`, `??`, archivos dentro de carpetas nuevas y renombrados con `origPath`.
    - En un directorio sin `.git`, `status()` lanza `GitError` con argumentos, código y stderr, y nunca devuelve "limpio".
    - Ninguna llamada usa `exec` ni concatena texto.
  - **Verificación:** `npm run lint && npm test`

- [ ] **TASK-006-002**: Añadir a `GitClient` `addPaths`, `commitPaths` (`commit -m <msg> --only -- <rutas>`), `restorePaths` y `removeFromIndex`.
  - **Requisito Asociado:** REQ-RUN-14, REQ-RUN-16, REQ-RUN-18
  - **Archivos a Modificar / Crear:**
    - `src/utils/git-client.ts`
    - `tests/git-client.test.ts`
  - **Criterio de Finalización:**
    - `commitPaths` confirma solo las rutas pedidas y deja preparado lo que ya lo estaba en otras rutas.
    - El mensaje `feat(X): $(touch pwned) " & echo x > pwned2 & "` queda literal y no crea `pwned` ni `pwned2`.
    - Ningún método invoca `push`, `fetch`, `pull`, `remote`, `clean` ni `reset`.
  - **Verificación:** `npm run lint && npm test`

- [ ] **TASK-006-003**: Añadir `createBranch` (`check-ref-format --branch`, error si la rama existe, `switch -c`) y eliminar `getStatus`, `createOrCheckoutBranch`, `commit(message)`, `resetHardAndClean` y `GitStatus`.
  - **Requisito Asociado:** REQ-RUN-19
  - **Archivos a Modificar / Crear:**
    - `src/utils/git-client.ts`
    - `tests/git-client.test.ts`
  - **Criterio de Finalización:**
    - Crear `sdd/x` cuando ya existe lanza un error y `sdd/x` sigue en el mismo commit.
    - Un nombre inválido (`a..b`) lanza un error sin crear nada.
    - Una búsqueda de `checkout -B`, `add -A`, `reset --hard` y `clean -fd` en `src/` no encuentra nada.
  - **Verificación:** `npm run lint && npm test`

- [ ] **TASK-006-004**: Crear `task-markdown.ts`: mover `parseTasksMarkdown` y `updateTaskStatusInMarkdown`, leer `Archivos a Modificar / Crear` en `MicroTask.files` y conservar BOM y finales de línea. `auto-runner.ts` los reexporta.
  - **Requisito Asociado:** REQ-RUN-01, REQ-RUN-20
  - **Archivos a Modificar / Crear:**
    - `src/core/task-markdown.ts`
    - `src/core/auto-runner.ts`
    - `tests/task-markdown.test.ts`
  - **Criterio de Finalización:**
    - Una tarea que declara `src/A.cs` y `sql\001_tabla.sql` expone `['src/A.cs', 'sql/001_tabla.sql']`.
    - Lo que aparece después de otro campo `- **X:**` no se toma como archivo.
    - Al marcar `[x]` en un `tasks.md` con BOM y CRLF solo cambia el byte de la casilla.
    - Las pruebas de parseo que ya existen siguen en verde.
  - **Verificación:** `npm run lint && npm test`

- [ ] **TASK-006-005**: Crear `task-paths.ts` con `validateDeclaredPath` y `computeOwnership` (propias, ajenas, inválidas; sin distinguir mayúsculas en `win32`; el `tasks.md` en curso queda excluido).
  - **Requisito Asociado:** REQ-RUN-02, REQ-RUN-03, REQ-RUN-04
  - **Archivos a Modificar / Crear:**
    - `src/core/task-paths.ts`
    - `tests/task-paths.test.ts`
  - **Criterio de Finalización:**
    - `../fuera.txt`, `C:\x`, `/etc/x` y `.git/config` son inválidas, cada una con su motivo.
    - `notas.txt` sucia y sin declarar es ajena.
    - El propio `tasks.md` nunca es ajeno.
    - En `win32`, `SRC/a.cs` declarada coincide con `src/a.cs` sucia.
  - **Verificación:** `npm run lint && npm test`

- [ ] **TASK-006-006**: Crear `command-executor.ts`: `shellExecutor` con `spawn(cmd, { shell: true })`, `findMissingExecutable` (en `win32`: comandos internos de cmd, rutas y `where` con `execFile`) e `isShellNotFoundCode` (127).
  - **Requisito Asociado:** REQ-RUN-07
  - **Archivos a Modificar / Crear:**
    - `src/core/command-executor.ts`
    - `tests/command-executor.test.ts`
  - **Criterio de Finalización:**
    - En Windows, `comando-inexistente-xyz` se detecta como inexistente, mientras que `echo hola`, `git --version` y una ruta `.\build.bat` existente no.
    - En Linux, ejecutar `comando-inexistente-xyz` devuelve 127.
    - `shellExecutor` devuelve el código real y la salida combinada.
  - **Verificación:** `npm run lint && npm test`

- [ ] **TASK-006-007**: Añadir `autonomous.autoCommit` (`false`) y `autonomous.commitMessageTemplate` a la configuración, y crear `formatCommitMessage`.
  - **Requisito Asociado:** REQ-RUN-13, REQ-RUN-15
  - **Archivos a Modificar / Crear:**
    - `src/core/config.ts`
    - `src/core/auto-runner.ts`
    - `tests/config.test.ts`
    - `tests/auto-runner.test.ts`
  - **Criterio de Finalización:**
    - `DEFAULT_CONFIG.autonomous.autoCommit` es `false`.
    - Con la plantilla `[{taskId}] {title}`, el mensaje es `[TASK-7] Alta de cliente`.
    - Sin `reqId`, se usa `SDD`.
    - Un `config.json` de la 1.x sin estas claves se carga con sus valores por defecto.
  - **Verificación:** `npm run lint && npm test`

- [ ] **TASK-006-008**: Reescribir las guardas por tarea de `executeAutonomousPlan`: rutas inválidas, sin `Verificación` y ejecutable inexistente pasan a BLOCKED sin ejecutar; se elimina el `npm test` por defecto. Reescribir `tests/auto-runner.test.ts` sobre repositorios temporales.
  - **Requisito Asociado:** REQ-RUN-02, REQ-RUN-06, REQ-RUN-07
  - **Archivos a Modificar / Crear:**
    - `src/core/auto-runner.ts`
    - `tests/auto-runner.test.ts`
  - **Criterio de Finalización:**
    - En los tres casos la tarea queda BLOCKED con su motivo y el ejecutor no recibe llamadas.
    - Con un código 127 hay un único intento.
    - La cadena `'npm test'` no aparece en `src/core/auto-runner.ts`.
  - **Verificación:** `npm run lint && npm test`

- [ ] **TASK-006-009**: Implementar la rama de éxito: marcar `[x]` y, solo con commit activo, hacer un commit acotado a `declaradas ∩ sucias − protegidas`; un `GitError` detiene la ejecución.
  - **Requisito Asociado:** REQ-RUN-13, REQ-RUN-14, REQ-RUN-17, REQ-RUN-18
  - **Archivos a Modificar / Crear:**
    - `src/core/auto-runner.ts`
    - `tests/auto-runner.test.ts`
  - **Criterio de Finalización:**
    - Con la configuración por defecto, HEAD no cambia y el espía no registra `add` ni `commit`.
    - Con `--commit`, el commit contiene solo `A.cs`, y `C.cs` sigue modificado.
    - Un hook `pre-commit` que sale con 1 detiene la ejecución con su stderr.
    - El espía no registra `push`, `fetch`, `pull` ni `remote`.
  - **Verificación:** `npm run lint && npm test`

- [ ] **TASK-006-010**: Implementar la rama de fallo: BLOCKED sin tocar archivos por defecto; con `--rollback` y confirmación, rollback acotado (`??` se borra, `A` pasa por `rm --cached` y se borra, el resto con `restore`), omitiendo con aviso las rutas compartidas y las protegidas.
  - **Requisito Asociado:** REQ-RUN-04, REQ-RUN-11, REQ-RUN-12
  - **Archivos a Modificar / Crear:**
    - `src/core/auto-runner.ts`
    - `tests/auto-runner.test.ts`
  - **Criterio de Finalización:**
    - Sin `--rollback`, un archivo sin seguimiento y un cambio previo ajenos sobreviven y `git status` solo cambia en `tasks.md`.
    - Con `--rollback --yes`, `A.cs` vuelve a HEAD, `B.cs` se borra y `C.cs` queda intacto.
    - Si `confirmRollback` responde que no, no se toca nada.
    - El espía no registra `clean` ni `reset`.
  - **Verificación:** `npm run lint && npm test`

- [ ] **TASK-006-011**: Crear `run-command.ts`: `buildRunPreflight`, `describeRun` y `runTasksCommand` (git no disponible, ajenas, `--dry-run`, TTY y `--yes`, confirmación y guardado de `tasks.md` con su formato).
  - **Requisito Asociado:** REQ-RUN-03, REQ-RUN-05, REQ-RUN-08, REQ-RUN-09, REQ-RUN-10, REQ-RUN-20
  - **Archivos a Modificar / Crear:**
    - `src/core/run-command.ts`
    - `tests/run-command.test.ts`
  - **Criterio de Finalización:**
    - Con `notas.txt` ajeno → código 1 y listado.
    - Sin `.git` → código 1 con el error de git.
    - Con `--dry-run` → el hash del directorio es idéntico.
    - Sin TTY y sin `--yes` → código 1.
    - En TTY respondiendo `n` → ejecutor sin llamadas y `tasks.md` intacto.
    - Una ejecución completa conserva el BOM y el CRLF de `tasks.md`.
  - **Verificación:** `npm run lint && npm test`

- [ ] **TASK-006-012**: Crear `buildTasksTemplate(autoCommit)` para la regla 5 y conectar `handleRun` en `cli.ts` con `--yes`, `--dry-run`, `--allow-dirty`, `--rollback` y `--commit`, más la ayuda.
  - **Requisito Asociado:** REQ-RUN-21, REQ-RUN-13
  - **Archivos a Modificar / Crear:**
    - `src/core/scaffold.ts`
    - `src/cli.ts`
    - `tests/scaffold.test.ts`
  - **Criterio de Finalización:**
    - Un `init` por defecto genera una regla 5 que menciona la autorización humana y no ordena hacer commit.
    - `--commit` o `autoCommit: true` activan el commit.
    - `npm run build` termina sin errores.
    - En un repositorio temporal, `node dist/cli.js run tasks.md --dry-run` no ejecuta nada, y `node dist/cli.js run tasks.md` con la entrada estándar redirigida (sin TTY) termina con código 1.
  - **Verificación:** `npm run lint && npm test && npm run build`

- [ ] **TASK-006-013**: Aplicar la enmienda de la constitución (§3.2) en `.sdd/constitution.md` y propagarla con `sdd sync`. Documentar «Qué comandos tocan git» en el README, añadir la entrada `[Unreleased]` al CHANGELOG, regenerar el grafo y revisar la calidad.
  - **Requisito Asociado:** REQ-RUN-12, REQ-RUN-13, REQ-RUN-18
  - **Archivos a Modificar / Crear:**
    - `.sdd/constitution.md`
    - `AGENTS.md`
    - `.cursorrules`
    - `.github/copilot-instructions.md`
    - `.agents/rules/sdd-rules.md`
    - `README.md`
    - `CHANGELOG.md`
    - `.sdd/architecture-graph.md`
    - `.sdd/context-graph.json`
  - **Criterio de Finalización:**
    - La §3.2 contiene el texto aprobado en PLAN-006, §6.
    - El README explica qué hace cada parámetro de `sdd run` con git y que nunca hace push.
    - El CHANGELOG lista los cambios incompatibles: sin commit, sin rollback y sin `npm test` por defecto, y la API eliminada.
    - `node dist/cli.js review src` da una puntuación ≥ 85.
  - **Verificación:** `npm run build && node dist/cli.js sync --yes && node dist/cli.js graph && node dist/cli.js review src`
