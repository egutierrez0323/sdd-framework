# PLAN-001: Arquitectura y Diseño Técnico del SDD Framework & CLI

- **Estado:** APPROVED
- **Especificación Asociada:** [SPEC-001](../specs/SPEC-001-SDD-FRAMEWORK.md)
- **Nivel de Severidad:** L2 (Standard)
- **Fecha:** 2026-10-12

---

## 1. Visión General de la Arquitectura

El sistema se compone de un motor modular TypeScript que puede ejecutarse directamente mediante CLI (`sdd` o `npx sdd`) o consumirse como librería. Todas las operaciones de auditoría, sincronización y ejecución autónoma son deterministas y se basan en archivos Markdown y JSON estándar.

```
sdd/
├── .sdd/
│   ├── config.json               # Configuración local de severidad y plugins
│   ├── templates/                # Plantillas oficiales (spec, plan, tasks, EARS)
│   ├── specs/                    # Especificaciones aprobadas y en revisión
│   ├── plans/                    # Planes técnicos
│   └── tasks/                    # Listas de micro-tareas con estado
├── src/
│   ├── index.ts                  # Exportación de APIs del núcleo
│   ├── cli.ts                    # Interfaz de línea de comandos (Argv parser sin dependencias pesadas)
│   ├── core/
│   │   ├── config.ts             # Carga y validación de sdd.config.json
│   │   ├── ears-validator.ts     # Validador sintáctico y de coherencia EARS / Gherkin
│   │   ├── reverse-engine.ts     # Escáner brownfield para generar AGENTS.md y SPEC-000
│   │   ├── auto-runner.ts        # Orquestador del bucle autónomo, git branch, verify y rollback
│   │   ├── bridges.ts            # Sincronizador de reglas (Cursor, Claude, Copilot, Antigravity)
│   │   └── clarifier.ts          # Generador del cuestionario socrático de clarificación
│   └── utils/
│       ├── fs-helpers.ts         # Utilidades seguras de lectura/escritura atómica
│       ├── git-client.ts         # Wrapper seguro de comandos git (branch, commit, stash, reset)
│       └── logger.ts             # Formateador visual para consola (árbitro / advertencias / errores)
└── tests/
    ├── ears-validator.test.ts
    ├── reverse-engine.test.ts
    └── auto-runner.test.ts
```

---

## 2. Contratos de Datos e Interfaces Principales

### 2.1 Configuración (`sdd.config.json`)
```typescript
export type SeverityLevel = 'L1' | 'L2' | 'L3';

export interface SddConfig {
  version: string;
  severity: SeverityLevel;
  projectType: 'greenfield' | 'brownfield';
  bridges: Array<'cursor' | 'claude' | 'copilot' | 'antigravity'>;
  paths: {
    specsDir: string;
    plansDir: string;
    tasksDir: string;
  };
  autonomous: {
    maxRetries: number;            // 3 por defecto
    createFeatureBranch: boolean;  // true por defecto
    branchPrefix: string;          // 'sdd/'
  };
}
```

### 2.2 Validador EARS (`ears-validator.ts`)
```typescript
export interface EarsRequirement {
  id: string;                      // ej: "REQ-001-01"
  name: string;
  type: 'Ubiquitous' | 'Event-driven' | 'State-driven' | 'Unwanted Behavior' | 'Optional';
  statement: string;
  acceptanceCriteria: {
    given: string;
    when: string;
    then: string;
  };
}

export interface ValidationReport {
  valid: boolean;
  severity: SeverityLevel;
  errors: Array<{ reqId?: string; line?: number; message: string }>;
  warnings: Array<{ reqId?: string; line?: number; message: string }>;
}
```

### 2.3 Modelo de Micro-Tareas (`auto-runner.ts`)
```typescript
export interface MicroTask {
  id: string;                      // ej: "TASK-001-001"
  title: string;
  reqId: string;                   // Requisito EARS obligatorio
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  files: string[];
  completionCriteria: string;
  verifyCommand: string;
  rawMarkdown: string;
}
```

---

## 3. Protocolo del Bucle Autónomo (`auto-runner.ts`)

1. **Paso 1: Chequeo de Pre-condiciones:**
   - Verifica que el árbol git esté limpio (`git status --porcelain`).
   - Verifica que `spec.md` y `plan.md` tengan estado `APPROVED`.
2. **Paso 2: Aislamiento en Rama:**
   - Si no está en rama `sdd/feature-xxx`, la crea a partir de la rama base (`git checkout -b sdd/feature-xxx`).
3. **Paso 3: Ejecución de Tareas:**
   - Lee `tasks.md`, busca la primera tarea con estado `[ ]`.
   - Se ejecuta el proceso de implementación.
   - Ejecuta `verifyCommand`.
   - **Caso Éxito:** Realiza `git commit -m "feat(${reqId}): ${taskTitle}"` y actualiza la tarea a `[x]`.
   - **Caso Fallo (≤ 3 intentos):** Permite ciclo de auto-corrección.
   - **Caso Fallo Continuo (> 3 intentos):**
     - Ejecuta `git reset --hard HEAD` y `git clean -fd`.
     - Actualiza `tasks.md` marcando la tarea como `[BLOCKED]`.
     - Emite informe de diagnóstico y detiene el proceso con código de salida 1.

---

## 4. Estrategia de Testing y Verificación

- **Framework de Tests:** `vitest` para ejecución ultra-rápida en memoria.
- **Pruebas Unitarias Clave:**
  - `ears-validator`: Debe detectar requerimientos válidos y rechazar textos ambiguos según el nivel de severidad L1/L2/L3.
  - `reverse-engine`: Debe analizar estructuras de proyecto modelo y producir `AGENTS.md` y `SPEC-000-BASELINE.md` válidos.
  - `auto-runner`: Debe probar la máquina de estados de tareas, el parseo de Markdown, los 3 reintentos y el rollback limpio ante fallos simulados.
- **Comandos de Verificación:**
  - `npm run build`: Compilación TypeScript estricta.
  - `npm test`: Ejecución completa de la suite de pruebas.
  - `npm run lint`: Verificación de sintaxis y tipos.
