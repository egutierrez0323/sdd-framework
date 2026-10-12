# PLAN-CARD-VALIDATION: Plan Técnico de Implementación para SPEC-CARD-VALIDATION

- **Estado:** APPROVED
- **Especificación Asociada:** [SPEC-CARD-VALIDATION](../specs/SPEC-CARD-VALIDATION.md)
- **Nivel de Severidad:** L2 (Standard)
- **Fecha:** 2026-10-12

---

## 1. Visión General de la Arquitectura
El validador se estructurará de forma modular y puramente funcional, sin dependencias externas en tiempo de ejecución (`zero dependencies`), garantizando rendimiento determinista en memoria (< 1 ms por validación).

```
src/
├── types.ts          # Contratos de datos, tipos TypeScript y enums
├── sanitizer.ts      # Normalización y extracción de dígitos (REQ-CARD-01)
├── luhn.ts           # Algoritmo de Luhn Módulo 10 (REQ-CARD-02)
├── brands.ts         # Identificación de franquicias IIN/BIN (REQ-CARD-03)
├── expiration.ts     # Verificación temporal de caducidad (REQ-CARD-04)
├── cvv.ts            # Reglas de código de seguridad por franquicia (REQ-CARD-05)
├── validator.ts      # Orquestador unificado y manejo de errores (REQ-CARD-06, REQ-CARD-07)
└── index.ts          # Fachada pública y exportaciones
```

---

## 2. Contratos de Datos e Interfaces (TypeScript)

```typescript
export type CardBrand = 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'UNKNOWN';

export interface CardInput {
  cardNumber: string;
  expMonth?: number;
  expYear?: number;
  cvv?: string;
}

export interface CardValidationResult {
  isValid: boolean;
  brand: CardBrand;
  luhnValid: boolean;
  expirationValid?: boolean;
  cvvValid?: boolean;
  errors: string[];
}
```

---

## 3. Estrategia de Testing y Verificación
- **Tests Unitarios:**
  - `tests/sanitizer.test.ts`: Validación con espacios, guiones, letras y vacíos.
  - `tests/luhn.test.ts`: Tarjetas reales conocidas (Visa, MC, Amex de prueba) y números con dígito de checksum corrompido.
  - `tests/brands.test.ts`: Prefijos y longitudes de cada marca soportada.
  - `tests/expiration.test.ts`: Años pasados, año corriente, mes anterior, fechas futuras válidas y años en 2 o 4 dígitos.
  - `tests/cvv.test.ts`: CVV de 3 dígitos (Visa/MC), 4 dígitos (Amex), y rechazos por longitud errónea o caracteres no numéricos.
  - `tests/validator.test.ts`: Integración total y casos de fallo no controlado / entradas nulas.
- **Comandos de Verificación:**
  - Individual: `node ../node_modules/vitest/vitest.mjs run tests/<archivo>.test.ts`
  - Global: `npm.cmd test`

---

## 4. Riesgos Técnicos y Mitigaciones
| Riesgo Técnico Identificado | Probabilidad / Impacto | Estrategia de Mitigación |
| :--- | :--- | :--- |
| Tarjetas con formato de año en 2 dígitos (ej. 26 vs 2026) | Media / Medio | Normalizar años menores a 100 sumando el siglo actual (2000). |
| Números de tarjeta muy extensos que causen integer overflow | Baja / Alto | Procesar el algoritmo de Luhn dígito a dígito como strings numéricos, nunca como un solo Number entero de JavaScript. |
| Inyección de caracteres no numéricos que arrojen excepciones | Media / Bajo | Sanitización estricta con RegExp `/\D/g` y validación defensiva en `validator.ts`. |
