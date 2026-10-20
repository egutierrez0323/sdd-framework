# TASKS-CARD-API: Micro-Tareas de Implementación para SPEC-CARD-API

- **Plan Asociado:** [PLAN-CARD-API](../plans/PLAN-CARD-API.md)
- **Modo de Ejecución:** [x] Autónomo Desatendido
- **Comando de Verificación General:** `node ../node_modules/vitest/vitest.mjs run`

---

## Reglas de Ejecución para la IA:
1. Tomar una micro-tarea a la vez en orden secuencial.
2. Cada tarea debe completarse en ≤ 30 minutos de tiempo estimado.
3. Ejecutar el comando de verificación antes de marcar la casilla como completada (`[x]`).
4. Si la verificación falla: intentar auto-corrección hasta 3 veces. Si no pasa, detener y reportar.
5. Pase obligatorio de refactorización Clean Code antes de cerrar.

---

## Lista de Micro-Tareas

- [x] **TASK-API-001**: Helpers HTTP de respuesta y parseo seguro de JSON con límite de tamaño
  - **Requisito Asociado:** REQ-API-05
  - **Archivos a Modificar / Crear:**
    - `src/api/http-utils.ts`
    - `tests/http-utils.test.ts`
  - **Criterio de Finalización:** Funciones `sendJson` y `parseJsonBody` con protección contra payloads gigantes (> 1MB) y manejo de errores.
  - **Verificación:** `node ../node_modules/vitest/vitest.mjs run tests/http-utils.test.ts`

- [x] **TASK-API-002**: Controladores de endpoints y enrutador REST
  - **Requisito Asociado:** REQ-API-01, REQ-API-02, REQ-API-03, REQ-API-04
  - **Archivos a Modificar / Crear:**
    - `src/api/handlers.ts`
    - `src/api/router.ts`
  - **Criterio de Finalización:** Despacho de rutas `/health`, `/api/v1/cards/validate`, `/api/v1/cards/luhn` y `/api/v1/cards/brand`.
  - **Verificación:** `node ../node_modules/typescript/bin/tsc --noEmit`

- [x] **TASK-API-003**: Servidor HTTP desacoplado y pruebas de integración end-to-end
  - **Requisito Asociado:** REQ-API-01, REQ-API-02, REQ-API-03, REQ-API-04, REQ-API-05
  - **Archivos a Modificar / Crear:**
    - `src/server.ts`
    - `tests/api.test.ts`
  - **Criterio de Finalización:** Suite completa de tests HTTP reales usando `fetch` nativo sobre servidor efímero pasando en verde.
  - **Verificación:** `node ../node_modules/vitest/vitest.mjs run tests/api.test.ts`

- [x] **TASK-API-004**: Punto de entrada CLI para arrancar el servidor y script `start`
  - **Requisito Asociado:** REQ-API-01
  - **Archivos a Modificar / Crear:**
    - `src/bin/server.ts`
    - `package.json`
    - `README.md`
  - **Criterio de Finalización:** Script `npm run start` funcional y documentado.
  - **Verificación:** `node ../node_modules/vitest/vitest.mjs run`
