# TASKS-{{ID}}: Micro-Tareas de Implementación para SPEC-{{ID}}

- **Plan Asociado:** [PLAN-{{ID}}](./PLAN-{{ID}}.md)
- **Modo de Ejecución:** [ ] Supervisado (Paso a paso) | [ ] Autónomo Desatendido
- **Comando de Verificación General:** `npm test`

---

## Reglas de Ejecución para la IA:
1. Tomar una micro-tarea a la vez en orden secuencial.
2. Cada tarea debe completarse en ≤ 30 minutos de tiempo estimado.
3. Ejecutar el comando de verificación antes de marcar la casilla como completada (`[x]`).
4. Si la verificación falla: intentar auto-corrección hasta 3 veces. Si no pasa, detener y reportar.
5. Realizar un commit git semántico tras completar la tarea.

---

## Lista de Micro-Tareas

- [ ] **TASK-{{ID}}-001**: [Nombre descriptivo de la tarea]
  - **Requisito Asociado:** REQ-{{ID}}-01
  - **Archivos a Modificar / Crear:**
    - `src/modulo/ejemplo.ts`
    - `tests/modulo/ejemplo.test.ts`
  - **Criterio de Finalización:** [Condición observable y medible]
  - **Verificación:** `npx vitest run tests/modulo/ejemplo.test.ts`

- [ ] **TASK-{{ID}}-002**: [Siguiente micro-tarea]
  - **Requisito Asociado:** REQ-{{ID}}-02
  - **Archivos a Modificar / Crear:**
    - `src/modulo/otro.ts`
  - **Criterio de Finalización:** [Condición observable]
  - **Verificación:** `npm test`
