# SPEC-{{ID}}: {{TITULO}}

- **Estado:** DRAFT | IN_REVIEW | APPROVED | OBSOLETE
- **Fecha de Creación:** {{FECHA}}
- **Nivel de Severidad:** L1 (Velocity) | L2 (Standard) | L3 (Draconian)
- **Autor / Responsable:** {{AUTOR}}
- **Módulo / Dominio:** {{DOMINIO}}

---

## 1. Contexto y Justificación (El "Por Qué")
<!-- Describe brevemente el problema de negocio o técnico que resuelve esta especificación y por qué es necesario implementarlo ahora. -->

---

## 2. Requerimientos del Sistema (Notación EARS)

### REQ-{{ID}}-01: [Nombre del Requerimiento]
- **Tipo EARS:** Ubicuo | Event-driven | State-driven | Unwanted Behavior | Optional
- **Declaración:**
  > [Escribe la declaración siguiendo el patrón EARS correspondiente]
- **Criterio de Aceptación:**
  - **DADO:** [Estado inicial]
  - **CUANDO:** [Acción]
  - **ENTONCES:** [Resultado observable]

### REQ-{{ID}}-02: [Casos de Error y Recuperación]
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > SI [error o fallo], ENTONCES el sistema deberá [recuperación/mensaje].
- **Criterio de Aceptación:**
  - **DADO:** [Condición anómala]
  - **CUANDO:** [Ocurre el fallo]
  - **ENTONCES:** [Resultado seguro esperado]

---

## 3. Límites y Restricciones (Out of Scope & Constraints)
- **Fuera de Alcance:**
  - [Qué NO se va a construir en esta iteración]
- **Restricciones Técnicas / Invariantes:**
  - [Rendimiento, compatibilidad, dependencias prohibidas]

---

## 4. Registro de Clarificación y Validación (El Árbitro)
<!-- Registro de preguntas incómodas respondidas en la fase de clarificación -->
| Pregunta / Caso Límite Evaluado | Decisión Tomada | Impacto en la Spec |
| :--- | :--- | :--- |
| ¿Qué ocurre si falla la conexión a mitad de proceso? | Se implementará cola idempotente con rollback local. | Cubierto en REQ-{{ID}}-02 |
