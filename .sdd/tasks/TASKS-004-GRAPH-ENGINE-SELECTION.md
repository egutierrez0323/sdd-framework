# TASKS-004: Micro-Tareas para Selección de Motor de Grafos y Leyenda

- **Plan Asociado:** [PLAN-004](../plans/PLAN-004-GRAPH-ENGINE-SELECTION.md)
- **Modo de Ejecución:** Autónomo Verificable
- **Comando de Verificación General:** `npm.cmd test`

---

## Lista de Micro-Tareas

- [x] **TASK-004-001**: Agregar skill `graphify` a `BUILTIN_SKILLS` y soporte de `graphEngine` en `ScaffoldOptions`.
  - **Requisito Asociado:** REQ-GRAPH-03, REQ-GRAPH-04
  - **Archivos a Modificar / Crear:**
    - `src/core/scaffold.ts`
    - `.agents/skills/graphify/SKILL.md`
  - **Verificación:** `npm.cmd test`

- [x] **TASK-004-002**: Incorporar la pregunta interactiva del motor de grafos con leyenda comparativa y soporte de flags CLI en `src/cli.ts`.
  - **Requisito Asociado:** REQ-GRAPH-01, REQ-GRAPH-02
  - **Archivos a Modificar / Crear:**
    - `src/cli.ts`
  - **Verificación:** `npm.cmd test`

- [x] **TASK-004-003**: Añadir pruebas unitarias en `tests/scaffold.test.ts` para verificar la persistencia de `graph.engine` y la creación de la skill `graphify`.
  - **Requisito Asociado:** REQ-GRAPH-01, REQ-GRAPH-02, REQ-GRAPH-03, REQ-GRAPH-04
  - **Archivos a Modificar / Crear:**
    - `tests/scaffold.test.ts`
  - **Verificación:** `npm.cmd test`
