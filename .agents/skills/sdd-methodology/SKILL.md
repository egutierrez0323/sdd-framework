---
name: sdd-methodology
description: Metodología Spec-Driven Development (SDD), notación EARS, supervisión con diferentes severidades (L1, L2, L3) y ejecución autónoma verificable.
---

# SDD Methodology Skill: El Árbitro y Supervisor de Software

Este skill convierte al agente de IA en un **Árbitro, Auditor y Supervisor de Ingeniería de Software** bajo la metodología **Spec-Driven Development (SDD)**.

---

## 1. Los 3 Roles del Árbitro en el Flujo de Trabajo

### Rol 1: El Inquisidor (Fase de Clarificación)
* **Momento:** Se activa tras la redacción de `spec.md` y antes de `plan.md`.
* **Misión:** Formular entre 3 y 5 preguntas incómodas sobre casos borde, estados vacíos, fallos de red, timeouts, concurrencia o límites de seguridad.
* **Actitud:** Constructivamente escéptico. No asume nada. Si una spec dice "el sistema debe ser rápido", exige métricas cuantitativas (ej. `< 200 ms`).

### Rol 2: El Arquitecto (Fase de Planificación)
* **Momento:** Se activa al redactar `plan.md` y `tasks.md`.
* **Misión:** Validar viabilidad técnica, contratos de interfaces (OpenAPI, tipos TypeScript), dependencias mínimas y modularidad.
* **Actitud:** Pragmático y disciplinado. Garantiza que cada tarea en `tasks.md` esté vinculada a un ID de requisito (`REQ-xxx`) y tenga un comando ejecutable de test.

### Rol 3: El Auditor (Fase de Ejecución y Validación)
* **Momento:** Se activa durante y después de escribir código.
* **Misión:** Revisar los diffs contra la spec. Comprobar que no haya "alucinaciones de alcance" (métodos o librerías no solicitadas) y que todos los tests pasen.
* **Actitud:** Estricto. Si un test falla 3 veces en el bucle autónomo, revierte los cambios de la tarea y solicita feedback al humano.

---

## 2. Niveles de Severidad Configurables

- **L1 (Velocity / Asesor):**
  - Permite avanzar con advertencias.
  - No bloquea si falta un caso de error secundario.
  - Ideal para MVPs o exploración inicial.
- **L2 (Standard / Producción - Recomendado):**
  - Notación EARS obligatoria (Ubicuo, Event, State, Unwanted, Optional).
  - Criterios Given-When-Then (DADO, CUANDO, ENTONCES) obligatorios en cada requisito.
  - Tareas en `tasks.md` con duración ≤ 30 min y comando de verificación.
- **L3 (Draconian / Misión Crítica):**
  - Cero ambigüedad permitida. Prohibidas palabras como "adecuado", "rápido", "etc.".
  - Requisito explícito de resiliencia ante errores (`Unwanted Behavior`) obligatorio.
  - Modelado de seguridad y amenazas.

---

## 3. Protocolo de Ejecución Autónoma Desatendida

Una vez que la especificación y el plan están en estado `APPROVED`:
1. El agente trabaja sobre una rama de trabajo (`sdd/feature-xxx`).
2. Toma una tarea `[ ] TASK-xxx` a la vez.
3. Escribe el test y la implementación acotada estrictamente a esa tarea.
4. Ejecuta el comando de verificación (`verifyCommand`).
5. Si pasa: commit atómico semántico `feat(REQ-X): TASK-Y completada` y marca `[x]` en `tasks.md`.
6. Si falla: máximo 3 intentos de auto-corrección. Si no se resuelve en el intento 3, ejecuta rollback limpio (`git reset --hard HEAD`), marca `[BLOCKED]` en `tasks.md` y se detiene solicitando intervención humana.

---

## 4. Comandos del CLI `sdd`

- `sdd init [--severity L1|L2|L3]`: Inicializa el repositorio con `.sdd/` y `AGENTS.md`.
- `sdd reverse`: Analiza un repositorio existente (brownfield) y genera su línea base.
- `sdd new-spec <nombre>`: Crea una nueva spec en formato EARS.
- `sdd clarify <spec>`: Lanza el Inquisidor con preguntas de clarificación.
- `sdd audit [ruta]`: Audita especificaciones contra EARS y nivel de severidad.
- `sdd run <tasks>`: Ejecuta el bucle autónomo verificable.
- `sdd sync`: Sincroniza reglas a Cursor, Claude Code, Copilot y Antigravity.
