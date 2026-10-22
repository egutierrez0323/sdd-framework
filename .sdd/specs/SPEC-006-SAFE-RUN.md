# SPEC-006: Ejecución Segura de `sdd run` (Sin Borrados ni Commits No Autorizados)

- **Estado:** APPROVED
- **Fecha de Creación:** 2026-10-22
- **Nivel de Severidad:** L3 (Draconian)
- **Autor / Responsable:** Claude Code · aprobada por el Lead Engineer el 2026-10-22 (decisiones recomendadas)
- **Módulo / Dominio:** SDD CLI (Auto-Runner, Git Client)
- **Origen:** Feedback de adopción brownfield, puntos 🔴 3, 🔴 4, 🟠 11, 🟠 12 y 🟡 17 (PR 2)

---

## 1. Contexto y Justificación (El "Por Qué")

`sdd run` lee un `tasks.md`, ejecuta el comando de `Verificación` de cada tarea pendiente y marca el resultado. **No implementa ni corrige código**: los "3 intentos" son el mismo comando lanzado tres veces. El trabajo que verifica lo hizo antes una persona o un agente, y normalmente está sin confirmar en el árbol de trabajo. Sobre ese estado:

1. Si una tarea falla tres veces, `git reset --hard HEAD` y `git clean -fd` (`src/utils/git-client.ts:53-60`, `src/core/auto-runner.ts:185-187`) descartan todos los cambios sin confirmar y borran los archivos sin seguimiento, también los ajenos a la tarea.
2. Sin línea de `Verificación` se usa `npm test` (`auto-runner.ts:156`), que en un proyecto que no es Node siempre falla: el borrado está garantizado.
3. Si la verificación pasa, `git add -A` y `git commit` (`git-client.ts:44-51`) confirman todo el repositorio sin autorización. `skipCommit` no se puede pasar desde la CLI (`src/cli.ts:457`). El historial de este repositorio lo demuestra: 9 commits "TASK-00X completada y verificada" creados por la suite de pruebas, entre ellos `e27fc93`, que incluyó 1.363 líneas de UI ajenas a la tarea.
4. git se invoca con `exec` y texto concatenado. `reqId`, texto libre del Markdown, acaba dentro de `git commit -m "..."`: inyección de comandos con `$(...)` en POSIX o con `"` y `&` en `cmd`. Los errores de git se ignoran, y `getStatus()` devuelve `isClean: true` cuando git falla.
5. Los comandos de `Verificación` se ejecutan sin mostrarse ni confirmarse.
6. `createOrCheckoutBranch` usa `git checkout -B`, que reinicia una rama existente.
7. Al actualizar `tasks.md`, los finales CRLF se convierten en LF.

### 1.1 Modelo de Amenazas

| Amenaza | Vector | Impacto | Mitigación |
| :--- | :--- | :--- | :--- |
| Destrucción de datos | Rollback global tras un fallo | Pérdida irrecuperable del trabajo sin confirmar | REQ-RUN-11, 12 |
| Divulgación de secretos | `git add -A` incluye `Web.config` o `.env` locales | Secretos en el historial | REQ-RUN-01, 13, 14 |
| Ejecución arbitraria | `Verificación:` en un `tasks.md` recibido en un PR | Código ajeno con los permisos del usuario | REQ-RUN-08, 09, 10 |
| Inyección de comandos | `Requisito Asociado:` con `$(...)` o `" & ...` | Ejecución de comandos al hacer commit | REQ-RUN-15, 16 |
| Escape de rutas | `Archivos a Modificar` con `../` o una ruta absoluta | El rollback borra fuera del repositorio | REQ-RUN-02 |
| Gobernanza | Commits automáticos sin autorización humana | Historial no aprobado por el equipo | REQ-RUN-13, 18, 21 |
| Fallo silencioso | git falla y se asume árbol limpio | Las guardas quedan desactivadas | REQ-RUN-05, 17 |

---

## 2. Requerimientos del Sistema (Notación EARS)

### REQ-RUN-01: Archivos declarados por cada tarea
- **Tipo EARS:** Ubicuo
- **Declaración:**
  > El sistema **deberá** leer de cada tarea la lista `Archivos a Modificar / Crear` y tratar esas rutas, relativas a la raíz del repositorio, como las únicas que la tarea puede preparar para commit o restaurar.
- **Criterio de Aceptación:**
  - **DADO:** Una tarea que declara `src/A.cs` y `sql/001_tabla.sql`.
  - **CUANDO:** Se analiza el `tasks.md`.
  - **ENTONCES:** La tarea expone exactamente esas dos rutas, normalizadas con `/`.

### REQ-RUN-02: Rutas declaradas inválidas
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > **SI** una ruta declarada es absoluta, sale de la raíz del repositorio mediante `..` o apunta dentro de `.git/`, **ENTONCES** el sistema **deberá** marcar la tarea como BLOCKED con ese motivo sin ejecutar su comando.
- **Criterio de Aceptación:**
  - **DADO:** Una tarea que declara `../fuera.txt`.
  - **CUANDO:** Se ejecuta `sdd run --yes`.
  - **ENTONCES:** La tarea queda BLOCKED con el motivo y el ejecutor de comandos no recibe ninguna llamada.

### REQ-RUN-03: Cambios ajenos en el árbol de trabajo
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > **SI** al arrancar hay cambios sin confirmar o archivos sin seguimiento no ignorados en rutas que no declara ninguna tarea pendiente y no se pasó `--allow-dirty`, **ENTONCES** el sistema **deberá** abortar antes de ejecutar ningún comando y listar esas rutas.
- **Criterio de Aceptación:**
  - **DADO:** Un archivo sin seguimiento `notas.txt` que no declara ninguna tarea.
  - **CUANDO:** Se ejecuta `sdd run --yes`.
  - **ENTONCES:** El código de salida es 1, la salida lista `notas.txt` y no se ejecuta ningún comando.

### REQ-RUN-04: Rutas protegidas
- **Tipo EARS:** State-driven
- **Declaración:**
  > **MIENTRAS** `sdd run` se ejecute con `--allow-dirty`, el sistema **deberá** tratar como protegidas las rutas con cambios previos que no declara ninguna tarea y excluirlas de toda preparación de commit y de todo rollback.
- **Criterio de Aceptación:**
  - **DADO:** `--allow-dirty --rollback --commit --yes`, un archivo sin seguimiento y un cambio previo en `Global.asax.cs`, ninguno declarado.
  - **CUANDO:** Una tarea pasa y la siguiente falla.
  - **ENTONCES:** Ambos archivos conservan sus bytes y ninguno aparece en el commit creado.

### REQ-RUN-05: Estado de git no verificable
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > **SI** la consulta del estado de git falla o el directorio no es un repositorio git, **ENTONCES** el sistema **deberá** abortar mostrando el error de git, salvo que se pase `--allow-dirty`, en cuyo caso deberá verificar las tareas con rollback y commit desactivados.
- **Criterio de Aceptación:**
  - **DADO:** Un directorio sin `.git`.
  - **CUANDO:** Se ejecuta `sdd run --yes`.
  - **ENTONCES:** El código de salida es 1 y la salida incluye el error de git.

### REQ-RUN-06: Tarea sin comando de verificación
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > **SI** una tarea pendiente no declara `Verificación`, **ENTONCES** el sistema **deberá** marcarla como BLOCKED con el motivo "sin comando de verificación" sin ejecutar ningún comando por defecto.
- **Criterio de Aceptación:**
  - **DADO:** Una tarea pendiente sin línea `Verificación`.
  - **CUANDO:** Se ejecuta `sdd run --yes`.
  - **ENTONCES:** La tarea queda BLOCKED con ese motivo y el ejecutor no recibe ninguna llamada.

### REQ-RUN-07: Comando de verificación no encontrado
- **Tipo EARS:** Unwanted Behavior
- **Enmienda:** 2026-10-22, aprobada por el Lead Engineer. En Windows, `cmd /c` devuelve 1 (no 9009) para un comando inexistente; ver PLAN-006, §8.
- **Declaración:**
  > **SI** el ejecutable del comando de verificación no existe, porque termina con el código 127 en sh o porque en Windows su primer ejecutable no es un comando interno de cmd ni se resuelve con `where` o como ruta, **ENTONCES** el sistema **deberá** detener la tarea con el motivo "comando no encontrado" sin ejecutarla ni reintentarla.
- **Criterio de Aceptación:**
  - **DADO:** La tarea con `Verificación: comando-inexistente-xyz`.
  - **CUANDO:** Se ejecuta `sdd run --yes` en Windows o en Linux.
  - **ENTONCES:** La tarea queda BLOCKED con el motivo "comando no encontrado" y, en Windows, el comando no llega a lanzarse.

### REQ-RUN-08: Confirmación previa de los comandos
- **Tipo EARS:** Event-driven
- **Declaración:**
  > **CUANDO** `sdd run` arranque sin `--yes`, el sistema **deberá** mostrar cada tarea pendiente con su comando de verificación y las operaciones git activadas, y pedir confirmación antes de ejecutar el primer comando.
- **Criterio de Aceptación:**
  - **DADO:** Una terminal interactiva y dos tareas pendientes.
  - **CUANDO:** Se ejecuta `sdd run` y el usuario responde `n`.
  - **ENTONCES:** No se ejecuta ningún comando y `tasks.md` conserva sus bytes.

### REQ-RUN-09: Ejecución sin terminal interactiva
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > **SI** no hay terminal interactiva y no se pasó `--yes`, **ENTONCES** el sistema **deberá** abortar sin ejecutar comandos e indicar que se use `--yes` o `--dry-run`.
- **Criterio de Aceptación:**
  - **DADO:** La entrada estándar no es una TTY.
  - **CUANDO:** Se ejecuta `sdd run tasks.md`.
  - **ENTONCES:** El código de salida es 1, no se ejecuta ningún comando y `tasks.md` conserva sus bytes.

### REQ-RUN-10: Simulación con `--dry-run`
- **Tipo EARS:** Optional
- **Declaración:**
  > **DONDE** se pase `--dry-run`, el sistema **deberá** mostrar las tareas pendientes, sus comandos y las operaciones git que haría, sin ejecutar comandos ni modificar archivos.
- **Criterio de Aceptación:**
  - **DADO:** Un `tasks.md` con tres tareas pendientes.
  - **CUANDO:** Se ejecuta `sdd run --dry-run`.
  - **ENTONCES:** El ejecutor no recibe ninguna llamada y el hash de todos los archivos es idéntico antes y después.

### REQ-RUN-11: Fallo sin rollback
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > **SI** una tarea falla y no se pasó `--rollback`, **ENTONCES** el sistema **deberá** marcarla como BLOCKED, detener la ejecución y no modificar ningún archivo salvo `tasks.md`.
- **Criterio de Aceptación:**
  - **DADO:** `--allow-dirty`, un archivo sin seguimiento y un cambio previo, ambos ajenos a la tarea.
  - **CUANDO:** La tarea falla.
  - **ENTONCES:** Ambos sobreviven con sus bytes y `git status` solo cambia en `tasks.md`.

### REQ-RUN-12: Rollback acotado y opcional
- **Tipo EARS:** Optional
- **Declaración:**
  > **DONDE** se pase `--rollback` y una tarea falle, el sistema **deberá** pedir confirmación (o asumirla con `--yes`) y restaurar desde HEAD solo las rutas declaradas por esa tarea que no estén protegidas, borrando únicamente los archivos nuevos declarados, sin usar `git clean` ni `git reset --hard`.
- **Criterio de Aceptación:**
  - **DADO:** Una tarea que declara `A.cs` (modificado) y `B.cs` (nuevo), y un `C.cs` modificado sin declarar, con `--allow-dirty`.
  - **CUANDO:** La tarea falla con `--rollback --yes`.
  - **ENTONCES:** `A.cs` vuelve a HEAD, `B.cs` se borra, `C.cs` queda intacto y ninguna invocación de git usa `clean` ni `reset`.

### REQ-RUN-13: Sin commits por defecto
- **Tipo EARS:** Ubicuo
- **Declaración:**
  > El sistema **deberá** tener `autonomous.autoCommit` en `false` por defecto y no ejecutar `git add`, `git commit` ni ninguna otra operación git de escritura salvo que `autoCommit` sea `true` o se pase `--commit`.
- **Criterio de Aceptación:**
  - **DADO:** Un `.sdd/config.json` sin `autoCommit` y una tarea cuya verificación pasa.
  - **CUANDO:** Se ejecuta `sdd run --yes`.
  - **ENTONCES:** HEAD no cambia y el índice de git no tiene nada preparado.

### REQ-RUN-14: Commit acotado a la tarea
- **Tipo EARS:** Optional
- **Declaración:**
  > **DONDE** `autonomous.autoCommit` sea `true` o se pase `--commit`, el sistema **deberá**, al superar una tarea, preparar solo sus rutas declaradas que tengan cambios y no estén protegidas, con `git add -- <rutas>`, y crear un commit.
- **Criterio de Aceptación:**
  - **DADO:** `--commit --allow-dirty`, una tarea que declara `A.cs` y cambios en `A.cs` y en `C.cs`.
  - **CUANDO:** La tarea pasa.
  - **ENTONCES:** El commit contiene solo `A.cs` y `C.cs` sigue modificado sin preparar.

### REQ-RUN-15: Mensaje de commit configurable
- **Tipo EARS:** Ubicuo
- **Declaración:**
  > El sistema **deberá** construir el mensaje de commit desde `autonomous.commitMessageTemplate`, con los marcadores `{reqId}`, `{taskId}` y `{title}` y el valor por defecto `feat({reqId}): {taskId} {title}`.
- **Criterio de Aceptación:**
  - **DADO:** `commitMessageTemplate` igual a `[{taskId}] {title}`.
  - **CUANDO:** La tarea `TASK-7` con título `Alta de cliente` pasa con `--commit`.
  - **ENTONCES:** El mensaje del commit es `[TASK-7] Alta de cliente`.

### REQ-RUN-16: Invocación de git sin shell
- **Tipo EARS:** Ubicuo
- **Declaración:**
  > El sistema **deberá** invocar git mediante `execFile` con los argumentos en una lista, de modo que ningún texto procedente de `tasks.md` sea interpretado por una shell.
- **Criterio de Aceptación:**
  - **DADO:** `Requisito Asociado: $(touch pwned) " & echo x > pwned2 & "`.
  - **CUANDO:** La tarea pasa con `--commit --yes`.
  - **ENTONCES:** No existen `pwned` ni `pwned2` y el mensaje del commit contiene el texto literal.

### REQ-RUN-17: Errores de git informados
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > **SI** una operación git termina con error, **ENTONCES** el sistema **deberá** detener la ejecución, mostrar la operación y su stderr, y terminar con código de salida 1.
- **Criterio de Aceptación:**
  - **DADO:** Un hook `pre-commit` que rechaza el commit.
  - **CUANDO:** Una tarea pasa con `--commit --yes`.
  - **ENTONCES:** La salida incluye `commit` y el stderr del hook, y el código de salida es 1.

### REQ-RUN-18: Sin operaciones sobre remotos
- **Tipo EARS:** Ubicuo
- **Declaración:**
  > El sistema **deberá** abstenerse de ejecutar `git push`, `git fetch`, `git pull` o cualquier otra operación sobre remotos.
- **Criterio de Aceptación:**
  - **DADO:** Un espía que registra cada invocación de git.
  - **CUANDO:** Se completa un `sdd run --commit --yes` con tres tareas.
  - **ENTONCES:** Ninguna invocación registrada usa `push`, `fetch`, `pull` ni `remote`.

### REQ-RUN-19: Rama de trabajo sin reinicio
- **Tipo EARS:** Event-driven
- **Declaración:**
  > **CUANDO** se cree una rama de trabajo, el sistema **deberá** validar el nombre con `git check-ref-format --branch`, abortar si la rama ya existe y crearla con `git switch -c`.
- **Criterio de Aceptación:**
  - **DADO:** Una rama `sdd/x` existente con commits propios.
  - **CUANDO:** Se pide crear la rama `sdd/x`.
  - **ENTONCES:** Se produce un error y `sdd/x` sigue apuntando al mismo commit.

### REQ-RUN-20: Formato de `tasks.md` conservado
- **Tipo EARS:** Ubicuo
- **Declaración:**
  > El sistema **deberá** conservar el BOM y los finales de línea originales de `tasks.md` al actualizar el estado de las tareas.
- **Criterio de Aceptación:**
  - **DADO:** Un `tasks.md` con BOM y finales CRLF.
  - **CUANDO:** Una tarea pasa a `[x]`.
  - **ENTONCES:** Solo cambian los bytes de esa casilla.

### REQ-RUN-21: Regla de commit en la plantilla de tareas
- **Tipo EARS:** Event-driven
- **Declaración:**
  > **CUANDO** `sdd init` genere `tasks.template.md`, el sistema **deberá** redactar la regla de commit según `autonomous.autoCommit` e indicar, con `false`, que los commits requieren autorización humana explícita.
- **Criterio de Aceptación:**
  - **DADO:** La configuración por defecto.
  - **CUANDO:** Se ejecuta `sdd init --yes`.
  - **ENTONCES:** La regla 5 de `tasks.template.md` menciona la autorización humana y no ordena hacer commit tras cada tarea.

---

## 3. Límites y Restricciones (Out of Scope & Constraints)

- **Fuera de Alcance:**
  - `openInBrowser` de `ui-server.ts` con `execFile` (punto 11): va en el PR 4, junto con `--host`.
  - Detectar el comando de verificación según el ecosistema (punto 7, PR 4).
  - Que `sdd run` ejecute un agente que corrija el código, y leer `autonomous.maxRetries` de la configuración en lugar del 3 fijo.
  - Exponer la creación de ramas como parámetro de la CLI: solo se corrige el método.
- **Restricciones Técnicas / Invariantes:**
  - El comando de `Verificación` se sigue ejecutando con shell, porque es su naturaleza (`msbuild ... && sqlcmd ...`). Se protege con REQ-RUN-08, 09 y 10, no con `execFile`.
  - Sin dependencias de terceros nuevas.
  - Pruebas en repositorios git temporales (`fs.mkdtemp` + `git init`), con el ejecutor inyectado y un espía de las invocaciones de git.
  - `autoCommit: false`, sin rollback por defecto y sin `npm test` por defecto son cambios incompatibles: requieren una versión mayor.
  - La §3.2 de la constitución de este repositorio ordena un commit por tarea. Se enmienda para condicionarlo a la autorización humana, lo que requiere aprobación explícita (§1.3).
  - Funciones de menos de 55 líneas y cláusulas de guarda (constitución, §4).

---

## 4. Registro de Clarificación y Validación (El Árbitro)

| Pregunta / Caso Límite Evaluado | Decisión Aprobada | Impacto en la Spec |
| :--- | :--- | :--- |
| ¿Qué son los "archivos de la tarea"? | (Recomendado) Las rutas declaradas en `Archivos a Modificar / Crear`. Los cambios aparecidos durante la ejecución no sirven, porque `sdd run` no modifica código. | REQ-RUN-01, 12, 14 |
| ¿Abortar ante cualquier cambio sin confirmar o solo ante los ajenos? | (Recomendado) Solo ante los ajenos. El flujo normal es "el agente implementa y `sdd run` verifica", con los cambios de la tarea aún sin confirmar: exigir el árbol limpio obligaría a usar `--allow-dirty` siempre y vaciaría la guarda. **Se aparta del texto literal del feedback.** | REQ-RUN-03 |
| ¿`--yes` confirma también el rollback? | (Recomendado) Sí, pero solo si además se pasó `--rollback`. | REQ-RUN-12 |
| ¿Qué se hace con un archivo nuevo sin declarar tras un fallo? | Se lista y se deja donde está. | REQ-RUN-12 |
| ¿Mensaje de commit por defecto? | `feat({reqId}): {taskId} {title}`, alineado con la convención actual. | REQ-RUN-15 |

---

## 5. Trazabilidad con el Feedback

| Punto del feedback | Requerimientos |
| :--- | :--- |
| 🔴 3. El rollback borra el trabajo ajeno | REQ-RUN-03, 04, 05, 06, 07, 11, 12 |
| 🔴 4. Commits automáticos sin autorización | REQ-RUN-01, 13, 14, 15, 18, 21 |
| 🟠 11. Comandos del sistema armados como texto | REQ-RUN-16, 17 |
| 🟠 12. `sdd run` ejecuta lo que diga el Markdown | REQ-RUN-02, 08, 09, 10 |
| 🟡 17. `git checkout -B` reinicia una rama | REQ-RUN-19 |
| 🟡 15 (extensión). `tasks.md` pierde CRLF | REQ-RUN-20 |
