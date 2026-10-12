# TASKS-002: Micro-Tareas de Implementación Clean Code & SDD Review

- **Especificación Asociada:** SPEC-002
- **Plan Asociado:** PLAN-002
- **Estado:** COMPLETED
- **Nivel de Severidad:** L2 (Standard)

---

## Lista de Micro-Tareas Secuenciales

- [x] **TASK-002-01: Diseñar Especificación y Plan EARS**
  - **REQ-ID:** REQ-002-01, REQ-002-02, REQ-002-03, REQ-002-04
  - **Estimación:** 15 min
  - **Verify:** `node dist/cli.js audit .sdd/specs/SPEC-002-CLEAN-CODE-AND-REVIEW.md`

- [x] **TASK-002-02: Crear Skill `.agents/skills/clean-code/SKILL.md`**
  - **REQ-ID:** REQ-002-01
  - **Estimación:** 15 min
  - **Verify:** Comprobar existencia y contenido con frontmatter válido en `.agents/skills/clean-code/SKILL.md`

- [x] **TASK-002-03: Implementar Módulo Core `src/core/code-reviewer.ts`**
  - **REQ-ID:** REQ-002-02
  - **Estimación:** 25 min
  - **Verify:** `npm run test -- tests/code-reviewer.test.ts`

- [x] **TASK-002-04: Implementar Tests Unitarios en `tests/code-reviewer.test.ts`**
  - **REQ-ID:** REQ-002-02
  - **Estimación:** 20 min
  - **Verify:** `npm run test`

- [x] **TASK-002-05: Integrar Comando `sdd review` en `src/cli.ts` y Compilar**
  - **REQ-ID:** REQ-002-03
  - **Estimación:** 15 min
  - **Verify:** `npm run build && node dist/cli.js review src/`

- [x] **TASK-002-06: Actualizar Constitución `AGENTS.md` con Reglas Clean Code & DRY**
  - **REQ-ID:** REQ-002-04
  - **Estimación:** 10 min
  - **Verify:** Comprobar sección Clean Code en `AGENTS.md`

- [x] **TASK-002-07: Verificación Global y Auditoría Final**
  - **REQ-ID:** REQ-002-01..04
  - **Estimación:** 10 min
  - **Verify:** `npm test && npm run lint && node dist/cli.js audit`
