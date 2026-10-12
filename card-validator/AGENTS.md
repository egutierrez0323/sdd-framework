# Constitución del Proyecto: card-validator

> **PRINCIPIO FUNDAMENTAL:** Ningún código de producción sin requisito EARS previo ni micro-tarea asociada en .sdd/tasks/.

## 1. Severidad Configurada: L2
- **L1 (Velocity):** Sugerencias no bloqueantes.
- **L2 (Standard):** EARS obligatorio, 100% tareas con tests y comandos de verificación.
- **L3 (Draconian):** Cero tolerancia a ambigüedades, modelado de resiliencia y rollback formal.

## 2. Flujo de Trabajo
1. Redactar `spec.md` con `sdd new-spec`.
2. Clarificar con el árbitro usando `sdd clarify`.
3. Diseñar `plan.md` y micro-tareas en `tasks.md`.
4. Ejecutar con verificación mediante `sdd run`.
