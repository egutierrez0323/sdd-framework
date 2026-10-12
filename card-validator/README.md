# 💳 Card Validator

> Biblioteca universal de validación de tarjetas de crédito construida bajo la metodología **Spec-Driven Development (SDD)**.

---

## 🌟 Características

- **Algoritmo de Luhn (Módulo 10):** Verificación matemática exacta sin riesgo de desbordamiento entero.
- **Detección de Franquicias (IIN/BIN):** Identificación automática de **Visa**, **Mastercard**, **American Express** y **Discover**.
- **Validación de Expiración:** Control temporal admitiendo formatos de año en 2 y 4 dígitos (`MM/YY` y `MM/YYYY`).
- **Validación de Código de Seguridad:** Verificación dinámica de CVV/CVC según la franquicia (4 dígitos para Amex, 3 dígitos para el resto).
- **Manejo Defensivo:** Limpieza y sanitización de caracteres no numéricos con tolerancia total a fallos.
- **Tipado Estricto:** Desarrollado 100% en TypeScript ESM con cero dependencias en producción.

---

## 📦 Instalación y Uso

```typescript
import { validateCreditCard, validateLuhn, detectCardBrand } from 'card-validator';

// 1. Validación Integral
const result = validateCreditCard({
  cardNumber: '4532 0151 1283 0366',
  expMonth: 12,
  expYear: 2030,
  cvv: '123'
});

console.log(result);
// {
//   isValid: true,
//   brand: 'VISA',
//   luhnValid: true,
//   expirationValid: true,
//   cvvValid: true,
//   errors: []
// }

// 2. Validación de Luhn Aislada
const isValidLuhn = validateLuhn('4532015112830366'); // true

// 3. Detección de Franquicia
const brand = detectCardBrand('378282246310005'); // 'AMEX'
```

---

## 🛡️ Trazabilidad SDD (Spec-Driven Development)

Este proyecto fue concebido y auditado con el marco SDD:

1. **Especificación EARS:** [.sdd/specs/SPEC-CARD-VALIDATION.md](.sdd/specs/SPEC-CARD-VALIDATION.md) (Nivel L2 Aprobado).
2. **Clarificación Socrática:** [.sdd/specs/SPEC-CARD-VALIDATION-clarification.md](.sdd/specs/SPEC-CARD-VALIDATION-clarification.md).
3. **Plan Arquitectónico:** [.sdd/plans/PLAN-CARD-VALIDATION.md](.sdd/plans/PLAN-CARD-VALIDATION.md).
4. **Micro-Tareas Verificables:** [.sdd/tasks/TASKS-CARD-VALIDATION.md](.sdd/tasks/TASKS-CARD-VALIDATION.md).
5. **Grafo de Arquitectura:** [.sdd/architecture-graph.md](.sdd/architecture-graph.md).
6. **Auditoría Clean Code:** Puntuación 100/100 (`sdd review`).

---

## 🧪 Pruebas

```bash
npm test
```
