# PLAN-005: Plan Técnico para Puentes No Destructivos y Constitución en Archivo Propio

- **Estado:** APPROVED
- **Especificación Asociada:** [SPEC-005](../specs/SPEC-005-SAFE-BRIDGES.md)
- **Nivel de Severidad:** L2
- **Fecha:** 2026-10-22
- **Entrega:** PR 1 (puntos 🔴 1, 🔴 2 y 🟡 15 del feedback). Debe fusionarse antes que el PR 2, que reutiliza `text-file.ts` y `prompt.ts`.

---

## 1. Visión General de la Arquitectura

Hoy cada comando escribe directamente en disco. El cambio central es separar **calcular** de **escribir**: `init`, `sync` y `reverse` construyen primero un **plan de archivos** (qué se crea, qué se modifica y con qué bytes) y después ese plan se muestra (`--dry-run`), se confirma (terminal interactiva) o se aplica con respaldo. Así `--dry-run`, la confirmación y el respaldo son una sola implementación para los tres comandos.

```
            ┌───────────────────┐
 sdd init ─►│ planScaffold()    │──┐
            └───────────────────┘  │   ┌──────────────┐    ┌─────────────────────┐
 sdd sync ─►┌───────────────────┐  ├──►│  FilePlan    │───►│ --dry-run: render   │
 sdd reverse│ planBridgeSync()  │──┘   │ create/modify│    │ TTY: confirmar      │
            └─────────┬─────────┘      │ /error       │    │ aplicar + respaldo  │
                      │                └──────────────┘    └─────────────────────┘
        ┌─────────────┼──────────────┬───────────────────┐
        ▼             ▼              ▼                   ▼
 resolveConstitution  managed-block  bridge-migration    text-file
 (.sdd/constitution)  (BEGIN/END)    (banner 1.x)        (BOM / EOL / UTF-8)
```

| Componente | Archivo | Responsabilidad | Requisitos |
| :--- | :--- | :--- | :--- |
| Texto con formato | `src/utils/text-file.ts` (nuevo) | Decodificar y codificar conservando BOM y fin de línea; rechazar lo que no sea UTF-8 válido. | REQ-BRIDGE-09 |
| Bloque gestionado | `src/core/managed-block.ts` (nuevo) | Localizar, validar, insertar y sustituir el bloque `SDD:BEGIN`/`SDD:END`. Funciones puras. | REQ-BRIDGE-02, 04 |
| Diff | `src/utils/line-diff.ts` (nuevo) | Diff unificado sin dependencias externas. | REQ-BRIDGE-08 |
| Plan de archivos | `src/core/file-plan.ts` (nuevo) | Modelo `FilePlan`, renderizado, confirmación, aplicación y respaldos. | REQ-BRIDGE-06, 07, 08 |
| Entrada interactiva | `src/utils/prompt.ts` (nuevo) | Interfaz `CliIO` (`isTTY`, `ask`) inyectable en las pruebas. | REQ-BRIDGE-07 |
| Puentes | `src/core/bridges.ts` (reescrito) | Tabla de destinos, contenido del bloque, origen de la constitución. | REQ-BRIDGE-02, 03, 05 |
| Migración 1.x | `src/core/bridge-migration.ts` (nuevo) | Banner heredado y constitución heredada en `AGENTS.md`. | REQ-BRIDGE-10, 11 |
| Andamiaje | `src/core/scaffold.ts` | `planScaffold()`; la constitución va a `.sdd/constitution.md`; conserva configuración y plantillas. | REQ-BRIDGE-01, 12 |
| Configuración | `src/core/config.ts` | Fusión `por defecto < existente < explícito`. | REQ-BRIDGE-12 |
| CLI | `src/cli.ts` | `--dry-run` y `--yes` en `init`, `sync` y `reverse`; `reverse` respeta `config.bridges`; códigos de salida. | REQ-BRIDGE-05, 07, 08 |

### 1.1 Reglas del bloque

- Marcadores exactos, cada uno en su propia línea: `<!-- SDD:BEGIN -->` y `<!-- SDD:END -->`.
- **Archivo sin bloque:** se conserva intacto y se añade al final: un salto de línea si el archivo no terminaba en uno, una línea en blanco y el bloque. Esos separadores forman parte de la región de SDD, de modo que el contenido original queda como prefijo exacto del archivo nuevo.
- **Archivo con bloque:** se sustituye solo el texto desde `BEGIN` hasta `END`, ambos incluidos.
- **Archivo inexistente:** se crea con solo el bloque, en LF y sin BOM.
- El texto que genera SDD (marcadores y cuerpo) se convierte al fin de línea del archivo destino; el contenido del equipo no se toca.
- **Cuerpo para `CLAUDE.md`:** la línea `@.sdd/constitution.md`.
- **Cuerpo para el resto** (`AGENTS.md`, `.cursorrules`, `.github/copilot-instructions.md` y `.agents/rules/sdd-rules.md`): una línea de origen, `<!-- Origen: .sdd/constitution.md · gestionado por SDD, no editar dentro del bloque -->`, seguida del texto completo de la constitución.
- `AGENTS.md` recibe el bloque siempre. Los demás destinos se toman de `config.bridges`; hacer seleccionable `AGENTS.md` corresponde al PR 4.

### 1.2 Origen de la constitución (`resolveConstitution`)

1. Si existe `.sdd/constitution.md`, ese es el origen.
2. Si no existe y `AGENTS.md` empieza (tras un posible BOM) por `# Constitución del Proyecto:`, se aplica la migración REQ-BRIDGE-11: el plan crea `.sdd/constitution.md` con los bytes originales de `AGENTS.md` y deja en `AGENTS.md` solo el bloque, con respaldo.
3. En otro caso, `sync` aborta sin plan (REQ-BRIDGE-05), mientras que `init` y `reverse` generan la constitución (estándar o inversa, como hoy) en `.sdd/constitution.md`.

### 1.3 Migración de puentes con el banner 1.x (REQ-BRIDGE-10)

Se comparan los bytes que siguen al banner y a su `\n\n` con el `AGENTS.md` **leído antes de la migración**:
- si coinciden, el archivo queda con solo el bloque y se respalda;
- si no coinciden, el contenido se conserva, se añade el bloque y se emite un aviso con la ruta.

---

## 2. Contratos de Datos e Interfaces

```typescript
// src/utils/text-file.ts
export type Eol = '\r\n' | '\n';
export interface TextContent { text: string; hasBom: boolean; eol: Eol; }
export class InvalidEncodingError extends Error { constructor(readonly filePath: string) }
export function decodeText(raw: Buffer, filePath: string): TextContent; // TextDecoder('utf-8', { fatal: true })
export function encodeText(content: TextContent): Buffer;
export function detectEol(text: string): Eol;            // primer salto encontrado; '\n' si no hay ninguno
export function toEol(text: string, eol: Eol): string;   // solo para texto generado por SDD

// src/core/managed-block.ts
export const BLOCK_BEGIN = '<!-- SDD:BEGIN -->';
export const BLOCK_END = '<!-- SDD:END -->';
export type BlockScan =
  | { kind: 'absent' }
  | { kind: 'present'; start: number; end: number }      // offsets: de BEGIN al final de END
  | { kind: 'malformed'; line: number; reason: string };
export function scanManagedBlock(text: string): BlockScan;
export function upsertManagedBlock(text: string, body: string, eol: Eol): string; // lanza ManagedBlockError

// src/core/file-plan.ts
export type FileChange =
  | { kind: 'create'; relPath: string; after: Buffer }
  | { kind: 'modify'; relPath: string; before: Buffer; after: Buffer; backup: boolean }
  | { kind: 'error'; relPath: string; message: string; line?: number };
export interface FilePlan { changes: FileChange[]; warnings: string[]; }
export interface ApplyReport { written: string[]; backups: string[]; errors: FileChange[]; }
export function renderFilePlan(plan: FilePlan): string;                 // lista + diff unificado
export async function confirmFilePlan(plan: FilePlan, io: CliIO): Promise<boolean>;
export async function applyFilePlan(plan: FilePlan, root: string, stamp: string): Promise<ApplyReport>;

// src/utils/prompt.ts
export interface CliIO { isTTY: boolean; ask(question: string): Promise<string>; }
export function createProcessIO(): CliIO;

// src/core/bridges.ts
export interface BridgeTarget { id: SupportedBridge | 'agents'; relPath: string; body: 'import' | 'inline'; }
export async function planBridgeSync(root: string, bridges: SupportedBridge[]): Promise<FilePlan>;
export async function syncBridges(root?: string, bridges?: SupportedBridge[]): Promise<SyncReport>; // plan + aplicar
export interface SyncReport {
  synced: SupportedBridge[]; skipped: SupportedBridge[]; details: Record<SupportedBridge, string>;
  failed: Array<{ relPath: string; message: string }>;   // nuevo
  backups: string[];                                      // nuevo
}

// src/core/scaffold.ts
export async function planScaffold(options: ScaffoldOptions): Promise<FilePlan>;
export async function scaffoldProject(options: ScaffoldOptions): Promise<ScaffoldResult>; // plan + aplicar

// src/core/config.ts
export function mergeConfig(existing: Partial<SddConfig> | null, explicit: Partial<SddConfig>): SddConfig;
```

- **Respaldo:** `.sdd/backups/<AAAAMMDD-HHMMSS>/<relPath>`, con un solo sello de tiempo por ejecución. Solo se respaldan los cambios `modify` con `backup: true`: primera inserción del bloque o migración 1.x.
- **Diff:** `line-diff.ts` recorta las líneas comunes al principio y al final y emite un único hunk con 3 líneas de contexto. Es exacto para los cambios de este PR, que siempre afectan a una sola región contigua, y no necesita dependencias.
- **Códigos de salida:**
  - `0` si todo se aplicó, se canceló o fue `--dry-run`;
  - `1` si hubo algún cambio `error` (se aplican los demás) o falta la constitución en `sync`.

---

## 3. Estrategia de Testing y Verificación

Todas las pruebas trabajan en directorios temporales (`fs.mkdtemp`) y comparan bytes con `Buffer.compare`. **Ninguna escribe en el repositorio**: se reescribe `tests/bridges.test.ts`, que hoy modifica el `CLAUDE.md` de este proyecto.

| Requisito | Prueba | Archivo |
| :--- | :--- | :--- |
| REQ-BRIDGE-01 | `init` dos veces con `AGENTS.md` propio: `.sdd/constitution.md` creada y sin cambios la segunda vez. | `tests/scaffold.test.ts` |
| REQ-BRIDGE-02 | `CLAUDE.md` y `AGENTS.md` propios → `init` + `sync` + `sync`: el original es prefijo exacto y hay un solo bloque. | `tests/bridges.test.ts` |
| REQ-BRIDGE-03 | Bloque de `CLAUDE.md` = `@.sdd/constitution.md`; bloque de `.cursorrules` contiene la constitución. | `tests/bridges.test.ts` |
| REQ-BRIDGE-04 | `BEGIN` sin `END`, `END` antes de `BEGIN`, dos bloques: archivo intacto, línea informada, el resto se procesa. | `tests/managed-block.test.ts`, `tests/bridges.test.ts` |
| REQ-BRIDGE-05 | `sync` sin constitución ni `AGENTS.md` heredado: hash del directorio idéntico y error. | `tests/bridges.test.ts` |
| REQ-BRIDGE-06 | Primer `init` crea un respaldo con bytes idénticos; el `sync` posterior no crea otro. | `tests/file-plan.test.ts` |
| REQ-BRIDGE-07 | `confirmFilePlan` con `CliIO` falso que responde `n`: no se escribe nada. | `tests/file-plan.test.ts` |
| REQ-BRIDGE-08 | `planScaffold` + `renderFilePlan` sin aplicar: hash del directorio idéntico y diff presente. | `tests/scaffold.test.ts`, `tests/line-diff.test.ts` |
| REQ-BRIDGE-09 | BOM + CRLF y LF sin BOM: BOM en el byte 0, ningún LF suelto y prefijo exacto; un archivo Windows-1252 se rechaza. | `tests/text-file.test.ts`, `tests/bridges.test.ts` |
| REQ-BRIDGE-10 | Banner + copia exacta → solo bloque y respaldo; banner + texto editado → se conserva y se avisa. | `tests/bridge-migration.test.ts` |
| REQ-BRIDGE-11 | `AGENTS.md` 1.x → `.sdd/constitution.md` byte a byte, `AGENTS.md` con solo el bloque y respaldo. | `tests/bridge-migration.test.ts` |
| REQ-BRIDGE-12 | `config.json` con `maxRetries: 5` y plantilla editada → ambas se conservan y se añaden las claves nuevas. | `tests/scaffold.test.ts`, `tests/config.test.ts` |

- **Comando de verificación de cada tarea:** `npm run lint && npm test`.
- **Cierre del PR:** `npm run build` y `node dist/cli.js review src` con puntuación ≥ 85.

---

## 4. Riesgos Técnicos y Mitigaciones

| Riesgo Técnico Identificado | Probabilidad / Impacto | Estrategia de Mitigación |
| :--- | :--- | :--- |
| Archivos en Windows-1252 (habituales en .NET): decodificarlos como UTF-8 alteraría bytes fuera del bloque. | Media / Alto | `decodeText` usa `TextDecoder` con `fatal: true`; si falla, el archivo genera un cambio `error` y no se toca. **Salvaguarda derivada de REQ-BRIDGE-02, aprobada con el plan.** |
| La constitución contiene un marcador `SDD:BEGIN`/`END` y rompe el bloque. | Baja / Medio | Se valida al resolver el origen; si aparece, se aborta con error. |
| Ediciones manuales dentro del bloque se pierden en el siguiente `sync`. | Media / Bajo | La línea de origen del bloque lo advierte; se documenta en el README. |
| Archivos con finales de línea mixtos. | Baja / Bajo | El bloque usa el primer fin de línea encontrado; el resto del archivo no se toca. |
| `.cursorrules` está en desuso en Cursor a favor de `.cursor/rules/*.mdc`. | Media / Bajo | Fuera de alcance (SPEC-005, §3). |
| Este repositorio tiene una constitución escrita a mano en inglés que no se migra sola. | Cierta / Medio | Tarea manual: mover `AGENTS.md` a `.sdd/constitution.md` y ejecutar `sdd sync`. Sus puentes con el banner 1.x se migran por REQ-BRIDGE-10. `card-validator/` es un ejemplo y queda como está. |

---

## 5. Cambios en la API Pública (aprobados el 2026-10-22, constitución §1.3)

`src/index.ts` reexporta todos los módulos, así que estos cambios afectan a la API pública:

- **`syncBridges`:** misma firma, distinto comportamiento (bloque en lugar de sustitución). Lanza un error si falta la constitución (antes, si faltaba `AGENTS.md`).
- **`SyncReport`:** añade `failed` y `backups`.
- **`ScaffoldResult`:** añade `modifiedFiles` y `backups`.
- **Nuevas exportaciones:** `planScaffold`, `planBridgeSync`, `mergeConfig`, `upsertManagedBlock`, `scanManagedBlock`, `BLOCK_BEGIN`, `BLOCK_END`, `decodeText`, `encodeText`, `renderFilePlan`, `applyFilePlan` y los tipos asociados.
- **Archivo de configuración:** no cambia de formato.
- **Puentes en disco:** su formato cambia, y la migración 1.x lo convierte.

---

## 6. Secuencia de Implementación (base para TASKS-005)

1. `text-file.ts` con sus pruebas (REQ-BRIDGE-09).
2. `managed-block.ts` con sus pruebas (REQ-BRIDGE-02, 04).
3. `line-diff.ts` y `prompt.ts` con sus pruebas.
4. `file-plan.ts`: render, confirmación, aplicación y respaldos (REQ-BRIDGE-06, 07, 08).
5. `bridges.ts` reescrito y `tests/bridges.test.ts` aislado en un directorio temporal (REQ-BRIDGE-02, 03, 05).
6. `bridge-migration.ts` (REQ-BRIDGE-10, 11).
7. `scaffold.ts` y `config.ts`: `planScaffold`, constitución propia, conservación de configuración y plantillas (REQ-BRIDGE-01, 12).
8. `cli.ts`: `--dry-run`, `--yes`, confirmación, códigos de salida y `reverse` con `config.bridges`.
9. Migración de este repositorio. Sección «Uso en proyectos existentes» del README (qué crea `init`, qué modifica y cómo). Entrada `[Unreleased]` en un `CHANGELOG.md` nuevo. Regenerar `.sdd/architecture-graph.md`.
