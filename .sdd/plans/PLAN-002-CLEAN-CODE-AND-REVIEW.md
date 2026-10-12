# PLAN-002: Plan de Implementación de Auto-Cuestionamiento, Clean Code y SDD Review

- **Especificación Asociada:** SPEC-002
- **Estado:** APPROVED
- **Fecha:** 2026-10-12
- **Arquitectura:** TypeScript ESM, Modular Core, Zero Heavy Dependencies

---

## 1. Enfoque Arquitectónico

1. **Zero External Heavy Dependencies:**
   - La detección de duplicación (DRY) y análisis de longitud de funciones se implementará con un algoritmo nativo eficiente en `src/core/code-reviewer.ts`.
   - Utiliza normalización de líneas (eliminación de espacios en blanco y comentarios), n-gram sliding window / hashing de secuencias de líneas para encontrar bloques repetidos idénticos (mínimo 5 líneas consecutivas idénticas).
   - Analizador léxico básico para identificar funciones (declaraciones `function`, métodos de clase, y arrow functions asignadas a constantes) y calcular sus líneas de extensión y conteo de parámetros.

2. **Skill `.agents/skills/clean-code/SKILL.md`:**
   - Define el protocolo y rúbrica para que Antigravity y cualquier LLM se autocuestione antes de dar por cerrada una tarea.
   - Pone énfasis en el ciclo Kent Beck: Red -> Green -> Refactor.

3. **Comando CLI `sdd review`:**
   - Añadido a `src/cli.ts` para que pueda ser ejecutado por el desarrollador o por scripts CI/CD.

4. **Trazabilidad 100%:**
   - Cada tarea en `TASKS-002-CLEAN-CODE-AND-REVIEW.md` se mapea a los REQ de SPEC-002.
