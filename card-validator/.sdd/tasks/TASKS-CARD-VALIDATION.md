# TASKS-CARD-VALIDATION: Micro-Tareas de Implementación para SPEC-CARD-VALIDATION

- **Plan Asociado:** [PLAN-CARD-VALIDATION](../plans/PLAN-CARD-VALIDATION.md)
- **Modo de Ejecución:** [x] Autónomo Desatendido
- **Comando de Verificación General:** `node ../node_modules/vitest/vitest.mjs run`

---

## Reglas de Ejecución para la IA:
1. Tomar una micro-tarea a la vez en orden secuencial.
2. Cada tarea debe completarse en ≤ 30 minutos de tiempo estimado.
3. Ejecutar el comando de verificación antes de marcar la casilla como completada (`[x]`).
4. Si la verificación falla: intentar auto-corrección hasta 3 veces. Si no pasa, detener y reportar.
5. Realizar commit / registro de avance tras completar cada tarea.

---

## Lista de Micro-Tareas

- [x] **TASK-CARD-001**: Definición de contratos, interfaces y tipos TypeScript
  - **Requisito Asociado:** REQ-CARD-01
  - **Archivos a Modificar / Crear:**
    - `src/types.ts`
  - **Criterio de Finalización:** Tipos e interfaces de `CardBrand`, `CardInput` y `CardValidationResult` exportados sin errores de compilación.
  - **Verificación:** `node ../node_modules/typescript/bin/tsc --noEmit`

- [x] **TASK-CARD-002**: Módulo de sanitización y extracción de dígitos
  - **Requisito Asociado:** REQ-CARD-01
  - **Archivos a Modificar / Crear:**
    - `src/sanitizer.ts`
    - `tests/sanitizer.test.ts`
  - **Criterio de Finalización:** Función `sanitizeCardNumber` que elimina espacios, guiones y caracteres no numéricos.
  - **Verificación:** `node ../node_modules/vitest/vitest.mjs run tests/sanitizer.test.ts`

- [x] **TASK-CARD-003**: Implementación del Algoritmo de Luhn (Módulo 10)
  - **Requisito Asociado:** REQ-CARD-02
  - **Archivos a Modificar / Crear:**
    - `src/luhn.ts`
    - `tests/luhn.test.ts`
  - **Criterio de Finalización:** Algoritmo de Luhn exacto y sin integer overflow para números de 13 a 19 dígitos.
  - **Verificación:** `node ../node_modules/vitest/vitest.mjs run tests/luhn.test.ts`

- [x] **TASK-CARD-004**: Detección de franquicia y marcas emisoras
  - **Requisito Asociado:** REQ-CARD-03
  - **Archivos a Modificar / Crear:**
    - `src/brands.ts`
    - `tests/brands.test.ts`
  - **Criterio de Finalización:** Reconocimiento de prefijos y longitudes de Visa, Mastercard, American Express y Discover.
  - **Verificación:** `node ../node_modules/vitest/vitest.mjs run tests/brands.test.ts`

- [x] **TASK-CARD-005**: Módulo de validación de fecha de caducidad
  - **Requisito Asociado:** REQ-CARD-04
  - **Archivos a Modificar / Crear:**
    - `src/expiration.ts`
    - `tests/expiration.test.ts`
  - **Criterio de Finalización:** Comparación temporal precisa soportando años en 2 y 4 dígitos y meses 1-12.
  - **Verificación:** `node ../node_modules/vitest/vitest.mjs run tests/expiration.test.ts`

- [x] **TASK-CARD-006**: Módulo de validación de código de seguridad CVV / CVC
  - **Requisito Asociado:** REQ-CARD-05
  - **Archivos a Modificar / Crear:**
    - `src/cvv.ts`
    - `tests/cvv.test.ts`
  - **Criterio de Finalización:** Validación de 4 dígitos para Amex y 3 dígitos para el resto de franquicias.
  - **Verificación:** `node ../node_modules/vitest/vitest.mjs run tests/cvv.test.ts`

- [x] **TASK-CARD-007**: Orquestador integral `validateCreditCard` y exportaciones del paquete
  - **Requisito Asociado:** REQ-CARD-07
  - **Archivos a Modificar / Crear:**
    - `src/validator.ts`
    - `src/index.ts`
    - `tests/validator.test.ts`
  - **Criterio de Finalización:** Validación unificada resiliente a entradas nulas/vacías con 100% de tests en verde.
  - **Verificación:** `node ../node_modules/vitest/vitest.mjs run`
