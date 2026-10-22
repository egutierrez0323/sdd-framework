# SPEC-005: Puentes de Agentes No Destructivos y Constitución en Archivo Propio

- **Estado:** APPROVED
- **Fecha de Creación:** 2026-10-22
- **Nivel de Severidad:** L2 (Standard)
- **Autor / Responsable:** Claude Code · aprobada por el Lead Engineer el 2026-10-22 (decisiones recomendadas)
- **Módulo / Dominio:** SDD CLI (Scaffold, Bridges, File I/O)
- **Origen:** Feedback de adopción brownfield, puntos 🔴 1, 🔴 2 y 🟡 15 (PR 1)

---

## 1. Contexto y Justificación (El "Por Qué")

Hoy `sdd init`, `sdd sync` y `sdd reverse` tratan los archivos de instrucciones de los agentes como si fueran exclusivamente de SDD:

1. `syncBridges` (`src/core/bridges.ts:28-65`) sustituye por completo `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md` y `.agents/rules/sdd-rules.md` con un banner más una copia de `AGENTS.md`, sin leer el destino ni dejar respaldo. Cada `sdd sync` repite la sustitución.
2. Si el proyecto ya tiene `AGENTS.md`, `scaffoldProject` (`src/core/scaffold.ts:399-423`) no escribe la constitución SDD y después copia ese `AGENTS.md` a todos los puentes: las reglas SDD no llegan a ningún agente y el proyecto pierde su `CLAUDE.md`.
3. `writeFileUtf8` (`src/utils/fs-helpers.ts:21-25`) no conserva el BOM ni los finales CRLF, y el banner queda delante del BOM.
4. `sdd reverse` (`src/cli.ts:289`) sincroniza siempre los cuatro puentes, ignorando `.sdd/config.json`.
5. Volver a ejecutar `sdd init` sobrescribe `.sdd/config.json` y `.sdd/templates/*`.
6. `tests/bridges.test.ts` ejecuta `syncBridges(process.cwd())` y reescribe los archivos de instrucciones de este mismo repositorio en cada `npm test`.

En un proyecto existente cuyo `CLAUDE.md` (~1.000 líneas) es la fuente de verdad del equipo, esto impide adoptar el framework.

---

## 2. Requerimientos del Sistema (Notación EARS)

### REQ-BRIDGE-01: Constitución SDD en archivo propio
- **Tipo EARS:** Ubicuo
- **Declaración:**
  > El sistema **deberá** escribir la constitución SDD en `.sdd/constitution.md` durante `sdd init` y `sdd reverse`, crearla solo si no existe y usarla como única fuente del contenido de los puentes.
- **Criterio de Aceptación:**
  - **DADO:** Un proyecto con un `AGENTS.md` propio y sin `.sdd/constitution.md`.
  - **CUANDO:** Se ejecuta `sdd init --yes` dos veces seguidas.
  - **ENTONCES:** Existe `.sdd/constitution.md` con la constitución SDD y la segunda ejecución no modifica sus bytes.

### REQ-BRIDGE-02: Bloque gestionado delimitado
- **Tipo EARS:** Event-driven
- **Declaración:**
  > **CUANDO** `sdd init`, `sdd sync` o `sdd reverse` actualicen un archivo de puente (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md` o `.agents/rules/sdd-rules.md`), el sistema **deberá** modificar únicamente el texto entre `<!-- SDD:BEGIN -->` y `<!-- SDD:END -->`, añadir el bloque al final del archivo si no lo tiene y crear el archivo con solo el bloque si no existe.
- **Criterio de Aceptación:**
  - **DADO:** Un `CLAUDE.md` y un `AGENTS.md` con contenido propio.
  - **CUANDO:** Se ejecuta `sdd init --yes` y después `sdd sync` dos veces.
  - **ENTONCES:** Los bytes fuera del bloque son idénticos a los originales (`Buffer.compare` = 0) y cada archivo contiene exactamente un bloque.

### REQ-BRIDGE-03: Contenido del bloque según el agente
- **Tipo EARS:** Ubicuo
- **Declaración:**
  > El sistema **deberá** escribir en el bloque de `CLAUDE.md` la importación `@.sdd/constitution.md`, y en el bloque de los demás puentes el texto completo de `.sdd/constitution.md` precedido de una línea que indique ese origen.
- **Criterio de Aceptación:**
  - **DADO:** Un `.sdd/constitution.md` con el texto X.
  - **CUANDO:** Se ejecuta `sdd sync`.
  - **ENTONCES:** El bloque de `CLAUDE.md` contiene solo la línea `@.sdd/constitution.md` y el bloque de `.cursorrules` contiene X completo.

### REQ-BRIDGE-04: Marcadores mal formados
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > **SI** un archivo de puente contiene un `<!-- SDD:BEGIN -->` sin su `<!-- SDD:END -->`, un `<!-- SDD:END -->` antes de su `<!-- SDD:BEGIN -->` o más de un bloque, **ENTONCES** el sistema **deberá** dejar ese archivo sin modificar, informar su ruta y la línea del problema, procesar los demás puentes y terminar con código de salida 1.
- **Criterio de Aceptación:**
  - **DADO:** Un `CLAUDE.md` con un `<!-- SDD:BEGIN -->` sin cierre.
  - **CUANDO:** Se ejecuta `sdd sync`.
  - **ENTONCES:** `CLAUDE.md` conserva sus bytes, la salida indica la ruta y la línea, `.cursorrules` sí se actualiza y el código de salida es 1.

### REQ-BRIDGE-05: Fuente de la constitución ausente
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > **SI** al ejecutar `sdd sync` no existe `.sdd/constitution.md` ni una constitución heredada que migrar (REQ-BRIDGE-11), **ENTONCES** el sistema **deberá** abortar sin modificar ningún archivo e indicar que se ejecute `sdd init`.
- **Criterio de Aceptación:**
  - **DADO:** Un proyecto sin `.sdd/constitution.md` y con un `AGENTS.md` propio.
  - **CUANDO:** Se ejecuta `sdd sync`.
  - **ENTONCES:** Ningún archivo cambia, la salida recomienda `sdd init` y el código de salida es 1.

### REQ-BRIDGE-06: Respaldo previo a la primera modificación
- **Tipo EARS:** Event-driven
- **Declaración:**
  > **CUANDO** el sistema vaya a insertar el bloque por primera vez en un archivo existente, el sistema **deberá** copiar antes sus bytes originales a `.sdd/backups/<AAAAMMDD-HHMMSS>/<ruta relativa>` e informar esa ruta.
- **Criterio de Aceptación:**
  - **DADO:** Un `CLAUDE.md` existente sin bloque SDD.
  - **CUANDO:** Se ejecuta `sdd init --yes` y después `sdd sync`.
  - **ENTONCES:** Existe una única copia de respaldo con los bytes originales; el `sync` posterior, con el bloque ya presente, no crea respaldos nuevos.

### REQ-BRIDGE-07: Confirmación en terminal interactiva
- **Tipo EARS:** State-driven
- **Declaración:**
  > **MIENTRAS** `sdd init`, `sdd sync` o `sdd reverse` se ejecuten en una terminal interactiva sin `--yes`, el sistema **deberá** listar los archivos existentes que va a modificar y pedir confirmación antes de escribir en ellos.
- **Criterio de Aceptación:**
  - **DADO:** Una terminal interactiva y un `CLAUDE.md` existente sin bloque.
  - **CUANDO:** Se ejecuta `sdd sync` y el usuario responde `n`.
  - **ENTONCES:** Ningún archivo cambia y el comando termina indicando que se canceló.

### REQ-BRIDGE-08: Simulación con `--dry-run`
- **Tipo EARS:** Optional
- **Declaración:**
  > **DONDE** se pase `--dry-run` a `sdd init`, `sdd sync` o `sdd reverse`, el sistema **deberá** mostrar los archivos que crearía o modificaría, con el diff unificado de cada modificación, sin escribir ningún archivo.
- **Criterio de Aceptación:**
  - **DADO:** Un proyecto con `CLAUDE.md` y `AGENTS.md` propios.
  - **CUANDO:** Se ejecuta `sdd init --dry-run`.
  - **ENTONCES:** El hash de todos los archivos del directorio es idéntico antes y después, y la salida lista cada archivo con su diff.

### REQ-BRIDGE-09: Conservación del BOM y los finales de línea
- **Tipo EARS:** Ubicuo
- **Declaración:**
  > El sistema **deberá** conservar el BOM UTF-8 en el byte 0 y el estilo de fin de línea (CRLF o LF) de cada archivo existente que modifique, y escribir el bloque con ese mismo estilo.
- **Criterio de Aceptación:**
  - **DADO:** Un `CLAUDE.md` con BOM y finales CRLF.
  - **CUANDO:** Se ejecuta `sdd sync`.
  - **ENTONCES:** El archivo empieza por `EF BB BF`, no contiene ningún `LF` sin `CR` delante y los bytes fuera del bloque son idénticos a los originales.

### REQ-BRIDGE-10: Migración de puentes con el banner heredado
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > **SI** un archivo de puente empieza con un banner de la versión 1.x (`<!-- SINCRONIZADO AUTOMÁTICAMENTE DESDE AGENTS.md (SDD FRAMEWORK) -->` o `<!-- REGLAS DE DESARROLLO SDD PARA ANTIGRAVITY -->`), **ENTONCES** el sistema **deberá** respaldarlo y dejar en él solo el bloque cuando el texto tras el banner coincida exactamente con el `AGENTS.md` previo a la migración, o conservarlo, añadir el bloque y avisar cuando no coincida.
- **Criterio de Aceptación:**
  - **DADO:** Un `CLAUDE.md` formado por el banner heredado más una copia exacta de `AGENTS.md`.
  - **CUANDO:** Se ejecuta `sdd sync --yes`.
  - **ENTONCES:** `CLAUDE.md` contiene solo el bloque y existe su respaldo con los bytes originales.

### REQ-BRIDGE-11: Migración de la constitución heredada en `AGENTS.md`
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > **SI** no existe `.sdd/constitution.md` y `AGENTS.md` empieza con la cabecera que generaba la versión 1.x (`# Constitución del Proyecto:`), **ENTONCES** el sistema **deberá** respaldar `AGENTS.md`, mover su contenido a `.sdd/constitution.md` y dejar en `AGENTS.md` solo el bloque gestionado.
- **Criterio de Aceptación:**
  - **DADO:** Un `AGENTS.md` generado por SDD 1.x y sin `.sdd/constitution.md`.
  - **CUANDO:** Se ejecuta `sdd sync --yes`.
  - **ENTONCES:** `.sdd/constitution.md` contiene el texto anterior byte a byte, `AGENTS.md` contiene solo el bloque y existe su respaldo.

### REQ-BRIDGE-12: `sdd init` conserva la configuración y las plantillas existentes
- **Tipo EARS:** Event-driven
- **Declaración:**
  > **CUANDO** `sdd init` se ejecute en un proyecto que ya tiene `.sdd/config.json` o archivos en `.sdd/templates/`, el sistema **deberá** conservar los valores y archivos existentes que no se hayan pasado explícitamente por parámetro, y añadir solo las claves y archivos que falten.
- **Criterio de Aceptación:**
  - **DADO:** Un `config.json` con `autonomous.maxRetries: 5` y un `spec.template.md` editado a mano.
  - **CUANDO:** Se ejecuta `sdd init --yes`.
  - **ENTONCES:** Ambos conservan su contenido y `config.json` incorpora las claves nuevas con su valor por defecto.

---

## 3. Límites y Restricciones (Out of Scope & Constraints)

- **Fuera de Alcance:**
  - Elegir los puentes por parámetro y no tocar los no pedidos en modo no interactivo (punto 6, PR 4).
  - Instalar los skills en `.claude/skills/` y no sobrescribir skills existentes (punto 9, PR 4).
  - El formato `.cursor/rules/*.mdc` de Cursor.
  - Plantillas y constitución por idioma (punto 14, PR 6): la constitución se sigue generando con el texto actual.
- **Restricciones Técnicas / Invariantes:**
  - Sin dependencias de terceros nuevas: el diff de `--dry-run` se implementa con un algoritmo de líneas propio.
  - El sistema no modifica `.gitignore` ni ningún archivo fuera de los puentes listados y de `.sdd/`.
  - En modo no interactivo se escribe sin preguntar, porque insertar el bloque no borra contenido y deja respaldo (REQ-BRIDGE-06).
  - El texto dentro del bloque pertenece a SDD: una edición manual ahí se pierde en el siguiente `sync`. Se documenta en el README.
  - Todas las pruebas usan directorios temporales (`fs.mkdtemp`); `tests/bridges.test.ts` deja de escribir en este repositorio.
  - Funciones de menos de 55 líneas y cláusulas de guarda (constitución, §4).

---

## 4. Registro de Clarificación y Validación (El Árbitro)

| Pregunta / Caso Límite Evaluado | Decisión Aprobada | Impacto en la Spec |
| :--- | :--- | :--- |
| ¿Dónde se inserta el bloque en un archivo existente? | (Recomendado) Al final, tras una línea en blanco: el contenido del equipo sigue primero. | REQ-BRIDGE-02 |
| ¿Qué contiene el bloque? | (Recomendado) En `CLAUDE.md`, la importación `@.sdd/constitution.md` (Claude Code la carga). En el resto, el texto completo, porque Cursor, Copilot y Codex no siguen enlaces de forma fiable. | REQ-BRIDGE-03 |
| ¿Dónde se guardan los respaldos? | (Recomendado) En `.sdd/backups/<fecha-hora>/`, no como `.bak` junto al archivo: no ensucia la raíz ni lo leen los agentes. | REQ-BRIDGE-06 |
| ¿Qué pasa con los puentes con el banner de la 1.x? | Se respaldan y se sustituyen solo si son una copia exacta; si alguien los editó, se conservan y se avisa. | REQ-BRIDGE-10 |
| ¿Cómo se migra este repositorio? | Tarea manual del plan: mover el `AGENTS.md` actual a `.sdd/constitution.md` y regenerar los puentes. | Plan |
| ¿Qué versión se publica? | (Recomendado) 2.0.0: cambia el formato de los puentes. | Release |

---

## 5. Trazabilidad con el Feedback

| Punto del feedback | Requerimientos |
| :--- | :--- |
| 🔴 1. `init` y `sync` sobrescriben las instrucciones | REQ-BRIDGE-02, 04, 06, 07, 08, 10 |
| 🔴 2. Con `AGENTS.md` existente no se instala la constitución | REQ-BRIDGE-01, 03, 05, 11 |
| 🟡 15. Codificación y finales de línea | REQ-BRIDGE-09 |
| Hallazgo propio: `init` sobrescribe config y plantillas | REQ-BRIDGE-12 |
