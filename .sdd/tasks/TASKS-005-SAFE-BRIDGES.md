# TASKS-005: Micro-Tareas para Puentes No Destructivos y Constitución en Archivo Propio

- **Plan Asociado:** [PLAN-005](../plans/PLAN-005-SAFE-BRIDGES.md)
- **Especificación:** [SPEC-005](../specs/SPEC-005-SAFE-BRIDGES.md)
- **Estado:** APPROVED
- **Modo de Ejecución:** Supervisado (paso a paso)
- **Comando de Verificación General:** `npm run lint && npm test`

---

## Reglas de Ejecución

1. Una micro-tarea a la vez, en orden. Cada una está estimada en ≤ 30 minutos.
2. Primero la prueba (rojo), después el código mínimo (verde) y por último el repaso de SRP y DRY (refactor).
3. Ejecutar el comando de verificación antes de marcar `[x]`. Si falla tres veces, detenerse y redactar un informe de bloqueo.
4. **Sin commits ni push sin autorización humana explícita.** Cada commit, cuando se autorice, sigue el formato `feat(REQ-X): descripción`.
5. **No ejecutar este archivo con `sdd run` de la versión 1.x:** esa versión hace `git add -A` y, ante fallos, `git reset --hard` + `git clean -fd`.
6. Todas las pruebas usan directorios temporales (`fs.mkdtemp`). Ninguna escribe en el árbol de este repositorio.

---

## Lista de Micro-Tareas

- [x] **TASK-005-001**: Crear `text-file.ts` para leer y escribir texto conservando BOM y fin de línea, y rechazar lo que no sea UTF-8 válido.
  - **Requisito Asociado:** REQ-BRIDGE-09
  - **Archivos a Modificar / Crear:**
    - `src/utils/text-file.ts`
    - `tests/text-file.test.ts`
  - **Criterio de Finalización:** `encodeText(decodeText(x))` devuelve los mismos bytes para BOM + CRLF, LF sin BOM y un archivo vacío; `detectEol` devuelve el primer salto; los bytes Windows-1252 `0xE9 0xF1` lanzan `InvalidEncodingError` con la ruta.
  - **Verificación:** `npm run lint && npm test`

- [x] **TASK-005-002**: Crear `managed-block.ts` con `scanManagedBlock` y `upsertManagedBlock` como funciones puras.
  - **Requisito Asociado:** REQ-BRIDGE-02, REQ-BRIDGE-04
  - **Archivos a Modificar / Crear:**
    - `src/core/managed-block.ts`
    - `tests/managed-block.test.ts`
  - **Criterio de Finalización:** Con el bloque ausente, el texto original es prefijo exacto del resultado. Con el bloque presente, solo cambia la región de `BEGIN` a `END`. Aplicar `upsert` dos veces da el mismo resultado. `BEGIN` sin `END`, `END` antes de `BEGIN` y dos bloques lanzan `ManagedBlockError` con el número de línea.
  - **Verificación:** `npm run lint && npm test`

- [x] **TASK-005-003**: Crear `line-diff.ts` (diff unificado por recorte de prefijo y sufijo comunes) y `prompt.ts` (interfaz `CliIO` y `createProcessIO`).
  - **Requisito Asociado:** REQ-BRIDGE-07, REQ-BRIDGE-08
  - **Archivos a Modificar / Crear:**
    - `src/utils/line-diff.ts`
    - `src/utils/prompt.ts`
    - `tests/line-diff.test.ts`
    - `tests/prompt.test.ts`
  - **Nota de ejecución:** se añadió `tests/prompt.test.ts` para cubrir `prompt.ts`, que no tenía archivo de pruebas declarado. Solo son pruebas; no cambia el alcance del código de producción.
  - **Criterio de Finalización:** El diff de un bloque añadido al final muestra solo líneas `+` con 3 líneas de contexto; el de un bloque sustituido muestra las líneas `-` y `+` de esa región; dos textos iguales dan un diff vacío.
  - **Verificación:** `npm run lint && npm test`

- [x] **TASK-005-004**: Crear `file-plan.ts` con el modelo `FilePlan`, `renderFilePlan` y `applyFilePlan`, con respaldos en `.sdd/backups/<sello>/`.
  - **Requisito Asociado:** REQ-BRIDGE-06, REQ-BRIDGE-08
  - **Archivos a Modificar / Crear:**
    - `src/core/file-plan.ts`
    - `tests/file-plan.test.ts`
  - **Criterio de Finalización:** Un cambio `modify` con `backup: true` copia antes los bytes originales a `.sdd/backups/<sello>/<relPath>`. Un cambio `error` no escribe nada y aparece en `ApplyReport.errors`. `renderFilePlan` lista las rutas con el diff de cada una.
  - **Verificación:** `npm run lint && npm test`

- [x] **TASK-005-005**: Añadir a `file-plan.ts` `confirmFilePlan` y `executeFilePlan`, que deciden entre `--dry-run`, confirmación y aplicación y devuelven el código de salida.
  - **Requisito Asociado:** REQ-BRIDGE-07, REQ-BRIDGE-08
  - **Archivos a Modificar / Crear:**
    - `src/core/file-plan.ts`
    - `tests/file-plan.test.ts`
  - **Criterio de Finalización:**
    - Con `dryRun`: el hash del directorio es idéntico y el código es 0.
    - Con un `CliIO` en TTY que responde `n`: no se escribe nada y el código es 0.
    - Con `yes` o sin TTY: se aplica sin preguntar.
    - Con algún cambio `error`: los demás se aplican y el código es 1.
  - **Verificación:** `npm run lint && npm test`

- [x] **TASK-005-006**: Reescribir `bridges.ts`: tabla de destinos, cuerpo del bloque (importación o texto completo), `resolveConstitution`, `planBridgeSync` y `syncBridges` como envoltorio. Aislar `tests/bridges.test.ts` y `tests/project-graph.test.ts` en directorios temporales.
  - **Requisito Asociado:** REQ-BRIDGE-02, REQ-BRIDGE-03, REQ-BRIDGE-05
  - **Ajuste aprobado el 2026-10-22:** se añade `tests/project-graph.test.ts`, que hoy reescribe `.sdd/architecture-graph.md` y `.sdd/context-graph.json` de este repositorio en cada `npm test`.
  - **Archivos a Modificar / Crear:**
    - `src/core/bridges.ts`
    - `tests/bridges.test.ts`
    - `tests/project-graph.test.ts`
  - **Criterio de Finalización:**
    - Con `CLAUDE.md` y `AGENTS.md` propios, tras dos `sync` el original es prefijo exacto (`Buffer.compare` = 0) y hay un solo bloque.
    - El bloque de `CLAUDE.md` es `@.sdd/constitution.md` y el de `.cursorrules` contiene la constitución.
    - Sin `.sdd/constitution.md` ni `AGENTS.md` heredado, `sync` lanza un error y el hash del directorio no cambia.
    - Ninguna prueba de puentes ni de grafo escribe con `process.cwd()` como destino.
    - `git status` es idéntico antes y después de `npm test`.
  - **Nota de ejecución:** `resolveConstitution` ya reconoce la constitución 1.x de `AGENTS.md` (paso 2 de PLAN-005, §1.2), pero en modo transitorio de solo lectura, para que `init` y `reverse` no fallen hasta las TASK-005-009 y 011. Mientras tanto, `AGENTS.md` no recibe bloque y `CLAUDE.md` recibe el texto completo, porque aún no existe `.sdd/constitution.md` que importar. La TASK-005-009 sustituye esto por la migración real.
  - **Verificación:** `npm run lint && npm test`

- [x] **TASK-005-007**: Convertir en cambios `error` los puentes con marcadores mal formados o en otra codificación, sin detener el resto.
  - **Requisito Asociado:** REQ-BRIDGE-04, REQ-BRIDGE-09
  - **Archivos a Modificar / Crear:**
    - `src/core/bridges.ts`
    - `tests/bridges.test.ts`
  - **Criterio de Finalización:**
    - Un `CLAUDE.md` con `BEGIN` sin cierre conserva sus bytes, se informa con su ruta y línea, y `.cursorrules` sí se actualiza.
    - Un `CLAUDE.md` con BOM y CRLF conserva `EF BB BF` en el byte 0, no tiene ningún LF suelto y el original es su prefijo exacto.
    - Un `CLAUDE.md` en Windows-1252 no se toca.
  - **Verificación:** `npm run lint && npm test`

- [x] **TASK-005-008**: Crear `bridge-migration.ts` para los puentes con el banner de la 1.x.
  - **Requisito Asociado:** REQ-BRIDGE-10
  - **Archivos a Modificar / Crear:**
    - `src/core/bridge-migration.ts`
    - `src/core/bridges.ts`
    - `tests/bridge-migration.test.ts`
  - **Criterio de Finalización:** Un puente con banner más una copia exacta de `AGENTS.md` queda con solo el bloque y con su respaldo. Un puente con banner y texto editado conserva el texto, recibe el bloque y genera un aviso con su ruta. El banner de Antigravity también se reconoce.
  - **Verificación:** `npm run lint && npm test`

- [x] **TASK-005-009**: Migrar la constitución heredada de `AGENTS.md` (cabecera `# Constitución del Proyecto:`) a `.sdd/constitution.md`.
  - **Requisito Asociado:** REQ-BRIDGE-11
  - **Archivos a Modificar / Crear:**
    - `src/core/bridge-migration.ts`
    - `src/core/bridges.ts`
    - `tests/bridge-migration.test.ts`
    - `tests/bridges.test.ts`
  - **Nota de ejecución:** se retiró de `tests/bridges.test.ts` la prueba del modo transitorio de solo lectura (TASK-005-006), porque esta tarea lo sustituye por la migración real. Su caso queda cubierto, con el comportamiento definitivo, en `tests/bridge-migration.test.ts`. Solo cambian pruebas.
  - **Criterio de Finalización:** Sin `.sdd/constitution.md` y con un `AGENTS.md` de la 1.x, después de `sync` ocurren tres cosas: `.sdd/constitution.md` contiene el texto anterior byte a byte, `AGENTS.md` contiene solo el bloque y existe su respaldo. La comparación de REQ-BRIDGE-10 usa el `AGENTS.md` previo a la migración.
  - **Verificación:** `npm run lint && npm test`

- [x] **TASK-005-010**: Añadir `mergeConfig` (`por defecto < existente < explícito`) y hacer que `init` cree las plantillas solo si faltan.
  - **Requisito Asociado:** REQ-BRIDGE-12
  - **Archivos a Modificar / Crear:**
    - `src/core/config.ts`
    - `src/core/scaffold.ts`
    - `tests/config.test.ts`
    - `tests/scaffold.test.ts`
  - **Criterio de Finalización:** Un `config.json` con `autonomous.maxRetries: 5` y un `spec.template.md` editado a mano se conservan tras `init`, y aparecen las claves nuevas con su valor por defecto. Un `severity` pasado explícitamente sí sustituye al existente.
  - **Verificación:** `npm run lint && npm test`

- [x] **TASK-005-011**: Crear `planScaffold`: la constitución va a `.sdd/constitution.md`, solo si falta, y los puentes a través del plan. `scaffoldProject` pasa a ser plan más aplicación.
  - **Requisito Asociado:** REQ-BRIDGE-01, REQ-BRIDGE-08
  - **Archivos a Modificar / Crear:**
    - `src/core/scaffold.ts`
    - `tests/scaffold.test.ts`
    - `src/core/bridges.ts`
  - **Nota de ejecución:** se tocó `src/core/bridges.ts`, que no estaba declarado. En un `init` nuevo, la constitución solo está planificada, no escrita, así que `planBridgeSync` recibe un tercer parámetro opcional, `pendingConstitution`, para usarla como si ya existiera. Además se exporta `bridgeRelPath(bridge)`, que devuelve `undefined` si `config.bridges` trae un identificador desconocido, para calcular `syncedBridges`. Ambos cambios son aditivos y compatibles.
  - **Criterio de Finalización:**
    - Con `AGENTS.md` propio, `init` crea `.sdd/constitution.md` y una segunda ejecución no la modifica.
    - `planScaffold` sin aplicar no cambia el hash del directorio y lista cada archivo con su diff.
    - Las pruebas de andamiaje que ya existen siguen en verde.
  - **Verificación:** `npm run lint && npm test`

- [x] **TASK-005-012**: Conectar `init`, `sync` y `reverse` en `cli.ts` y exportar los módulos nuevos en `src/index.ts`.
  - **Requisito Asociado:** REQ-BRIDGE-05, REQ-BRIDGE-07, REQ-BRIDGE-08
  - **Ajuste aprobado el 2026-10-22:** se añade `src/index.ts` para las exportaciones nuevas aprobadas en PLAN-005, §5.
  - **Archivos a Modificar / Crear:**
    - `src/cli.ts`
    - `src/index.ts`
    - `src/core/scaffold.ts`
    - `tests/scaffold.test.ts`
    - `dist/` (salida de `npm run build`)
  - **Nota de ejecución:**
    - Para no duplicar la lógica de constitución y línea base en la CLI, se añadió `planReverse` a `scaffold.ts`, con 2 pruebas en `tests/scaffold.test.ts`. Así `reverse` respeta `config.bridges`.
    - En modo no interactivo, `init` sigue usando los puentes de la 1.x (`cursor`, `claude` y `antigravity`), porque elegirlos con `--bridges` es el punto 6 (PR 4).
    - `npm run build` regenera `dist/`. Se restauraron los archivos de `dist/` que solo cambiaban de metadatos por `core.autocrlf`, de modo que solo quedan los 18 con cambios reales y los 24 de los módulos nuevos.
  - **Criterio de Finalización:**
    - `src/index.ts` exporta `text-file`, `managed-block`, `line-diff`, `prompt`, `file-plan` y `bridge-migration`, y `npm run build` genera sus `.d.ts`.
    - Los tres comandos aceptan `--dry-run` y `--yes` y usan `executeFilePlan`.
    - `parseInitCliArgs` solo devuelve los valores pasados explícitamente.
    - `reverse` usa `config.bridges`.
    - La ayuda documenta `--dry-run`, `--yes` y `--lang`.
    - `npm run build` termina sin errores.
    - En un directorio temporal con un `CLAUDE.md` propio, `node dist/cli.js init --yes --dry-run` no escribe nada y `node dist/cli.js sync` sin constitución termina con código 1.
  - **Verificación:** `npm run lint && npm test && npm run build`

- [x] **TASK-005-013**: Migrar este repositorio al formato nuevo usando la propia migración 1.x.
  - **Requisito Asociado:** REQ-BRIDGE-10, REQ-BRIDGE-02
  - **Archivos a Modificar / Crear:**
    - `.sdd/constitution.md`
    - `AGENTS.md`
    - `CLAUDE.md`
    - `.cursorrules`
    - `.github/copilot-instructions.md`
    - `.agents/rules/sdd-rules.md`
  - **Pasos:**
    1. Copiar los bytes de `AGENTS.md` a `.sdd/constitution.md`. Esta constitución está escrita a mano y no tiene la cabecera 1.x, así que REQ-BRIDGE-11 no la detecta.
    2. Ejecutar `node dist/cli.js sync --yes`. Los cuatro puentes con banner, copias exactas de `AGENTS.md`, quedan con solo el bloque y con respaldo (REQ-BRIDGE-10). `AGENTS.md` recibe el bloque al final.
    3. Quitar a mano de `AGENTS.md` el texto que queda fuera del bloque, porque ya vive en `.sdd/constitution.md`.
    4. Ejecutar `node dist/cli.js sync --dry-run` y comprobar que no propone cambios.
  - **Criterio de Finalización:**
    - `.sdd/constitution.md` coincide byte a byte con el `AGENTS.md` anterior.
    - `CLAUDE.md` contiene solo el bloque con `@.sdd/constitution.md`.
    - `AGENTS.md` y los demás puentes contienen solo el bloque con la constitución.
    - Existen los cuatro respaldos en `.sdd/backups/`.
    - `card-validator/` no cambia.
    - `npm test` no modifica ningún archivo del repositorio (`git status` idéntico antes y después).
  - **Verificación:** `npm run build && npm test`

- [x] **TASK-005-015**: Hacer que `sdd ui` lea la constitución de `.sdd/constitution.md` y use `AGENTS.md` solo como respaldo, indicando en el visor de qué archivo sale.
  - **Requisito Asociado:** REQ-BRIDGE-01
  - **Origen:** añadida y aprobada el 2026-10-22 tras la TASK-005-013. Con el formato 2.0, `AGENTS.md` solo tiene el bloque o es un archivo del equipo, y el visor mostraba la fuente equivocada. Se ejecuta antes que la TASK-005-014.
  - **Archivos a Modificar / Crear:**
    - `src/core/ui-server.ts`
    - `src/core/ui-html.ts`
    - `tests/ui-server.test.ts`
  - **Criterio de Finalización:**
    - Con `.sdd/constitution.md` y un `AGENTS.md` del equipo, `/api/data` devuelve el texto de `.sdd/constitution.md` y `constitutionPath: ".sdd/constitution.md"`.
    - Con solo un `AGENTS.md` de la 1.x, devuelve ese texto y `constitutionPath: "AGENTS.md"`.
    - Sin ninguno, devuelve el texto vacío y `constitutionPath` vacío.
    - El HTML del visor ya no fija «(AGENTS.md)» en el título: muestra la ruta real que llega en los datos.
    - No se cambia nada más de `ui-server.ts`; escuchar en `127.0.0.1` es el punto 10 (PR 4).
  - **Verificación:** `npm run lint && npm test`

- [x] **TASK-005-014**: Documentar y cerrar: sección «Uso en proyectos existentes» del README, `CHANGELOG.md` con `[Unreleased]`, grafo de arquitectura y revisión de calidad.
  - **Requisito Asociado:** REQ-BRIDGE-01, REQ-BRIDGE-02, REQ-BRIDGE-06
  - **Archivos a Modificar / Crear:**
    - `README.md`
    - `CHANGELOG.md`
    - `.sdd/architecture-graph.md`
    - `.sdd/context-graph.json`
  - **Criterio de Finalización:**
    - El README explica qué archivos crea `init`, cuáles modifica y cómo funciona el bloque delimitado, además de los respaldos, `--dry-run` y que una edición dentro del bloque se pierde.
    - El CHANGELOG registra los cambios incompatibles.
    - `node dist/cli.js review src` da una puntuación ≥ 85.
  - **Verificación:** `npm run build && node dist/cli.js graph && node dist/cli.js review src`
