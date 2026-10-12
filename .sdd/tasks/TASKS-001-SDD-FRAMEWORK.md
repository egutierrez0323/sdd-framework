# TASKS-001: Micro-Tareas de Implementación para SPEC-001

- **Plan Asociado:** [PLAN-001](../plans/PLAN-001-SDD-FRAMEWORK.md)
- **Modo de Ejecución:** [x] Autónomo Verificable
- **Comando de Verificación General:** `npm test`

---

## Lista de Micro-Tareas

- [x] **TASK-001-001**: Inicialización del entorno TypeScript y Toolchain de testing
  - **Requisito Asociado:** REQ-001-01
  - **Archivos a Crear:**
    - `package.json`
    - `tsconfig.json`
    - `vitest.config.ts`
  - **Criterio de Finalización:** Entorno TypeScript configurado en modo estricto, scripts de `build` y `test` funcionando.
  - **Verificación:** `npm run build`

- [x] **TASK-001-002**: Configuración central y logger con niveles de severidad
  - **Requisito Asociado:** REQ-001-01, REQ-001-03
  - **Archivos a Crear:**
    - `src/core/config.ts`
    - `src/utils/logger.ts`
    - `src/utils/fs-helpers.ts`
  - **Criterio de Finalización:** Tipos e interfaces de configuración `sdd.config.json` con soporte L1, L2, L3 y utilidades de log formateadas.
  - **Verificación:** `npx vitest run tests/config.test.ts`

- [x] **TASK-001-003**: Validador sintáctico y de coherencia EARS / Gherkin
  - **Requisito Asociado:** REQ-001-03
  - **Archivos a Crear:**
    - `src/core/ears-validator.ts`
    - `tests/ears-validator.test.ts`
  - **Criterio de Finalización:** Parser de Markdown que extrae requisitos, valida patrones EARS (Ubicuo, Event, State, Unwanted, Optional) y aplica reglas de severidad L1/L2/L3.
  - **Verificación:** `npx vitest run tests/ears-validator.test.ts`

- [x] **TASK-001-004**: Motor de Ingeniería Inversa (Reverse-SDD para Brownfield)
  - **Requisito Asociado:** REQ-001-02
  - **Archivos a Crear:**
    - `src/core/reverse-engine.ts`
    - `tests/reverse-engine.test.ts`
  - **Criterio de Finalización:** Escáner que detecta stack, scripts, dependencias y estructura de un proyecto existente y genera un borrador de `AGENTS.md` y `SPEC-000-BASELINE.md`.
  - **Verificación:** `npx vitest run tests/reverse-engine.test.ts`

- [x] **TASK-001-005**: Sincronizador de Puentes (Bridges Agnósticos)
  - **Requisito Asociado:** REQ-001-07
  - **Archivos a Crear:**
    - `src/core/bridges.ts`
    - `tests/bridges.test.ts`
  - **Criterio de Finalización:** Capacidad de exportar las reglas de `AGENTS.md` hacia `.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md` y `.agents/skills`.
  - **Verificación:** `npx vitest run tests/bridges.test.ts`

- [x] **TASK-001-006**: Orquestador del Bucle Autónomo y Rollback Seguro
  - **Requisito Asociado:** REQ-001-05, REQ-001-06
  - **Archivos a Crear:**
    - `src/core/auto-runner.ts`
    - `src/utils/git-client.ts`
    - `tests/auto-runner.test.ts`
  - **Criterio de Finalización:** Parser de `tasks.md`, ejecución de comandos de verificación por tarea, creación de rama `sdd/feature-xxx`, commits atómicos semánticos y rollback limpio tras 3 fallos.
  - **Verificación:** `npx vitest run tests/auto-runner.test.ts`

- [x] **TASK-001-007**: Interfaz CLI Unificada (`sdd`)
  - **Requisito Asociado:** REQ-001-01, REQ-001-04
  - **Archivos a Crear:**
    - `src/cli.ts`
    - `src/index.ts`
    - `src/core/clarifier.ts`
  - **Criterio de Finalización:** CLI funcional con comandos `init`, `reverse`, `new-spec`, `clarify`, `audit`, `run`, `sync`.
  - **Verificación:** `node dist/cli.js --help`

- [x] **TASK-001-008**: Skill Universal Antigravity y Documentación
  - **Requisito Asociado:** REQ-001-01, REQ-001-07
  - **Archivos a Crear:**
    - `README.md`
    - `.agents/skills/sdd-methodology/SKILL.md`
  - **Criterio de Finalización:** Guía completa de uso y Skill registrado para el asistente con los prompts del Inquisidor, Arquitecto y Auditor.
  - **Verificación:** `npm test`
