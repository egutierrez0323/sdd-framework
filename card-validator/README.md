# 💳 Card Validator & REST API

> Microservicio y biblioteca universal de validación de tarjetas de crédito construida bajo la metodología **Spec-Driven Development (SDD)**.

---

## 🌟 Características

- **Algoritmo de Luhn (Módulo 10):** Verificación matemática exacta sin riesgo de desbordamiento entero.
- **Detección de Franquicias (IIN/BIN):** Identificación automática de **Visa**, **Mastercard**, **American Express** y **Discover**.
- **Validación de Expiración:** Control temporal admitiendo formatos de año en 2 y 4 dígitos (`MM/YY` y `MM/YYYY`).
- **Validación de Código de Seguridad:** Verificación dinámica de CVV/CVC según la franquicia (4 dígitos para Amex, 3 dígitos para el resto).
- **API REST Nativa:** Servidor HTTP ultraveloz en `node:http` con **cero dependencias externas**.
- **Tipado Estricto:** Desarrollado 100% en TypeScript ESM.

---

## 🚀 Arranque de la API REST

```bash
# 1. Compilar
npm.cmd run build

# 2. Iniciar el servidor (puerto 3000 por defecto)
npm.cmd start
```

### Endpoints Disponibles:

#### 1. Diagnóstico del Servicio
* **`GET /health`**
```bash
curl http://localhost:3000/health
```
```json
{
  "status": "ok",
  "uptime": 12.34,
  "timestamp": "2026-10-12T13:45:00.000Z"
}
```

#### 2. Validación Integral de Tarjeta
* **`POST /api/v1/cards/validate`**
```bash
curl -X POST http://localhost:3000/api/v1/cards/validate \
  -H "Content-Type: application/json" \
  -d '{
    "cardNumber": "4532 0151 1283 0366",
    "expMonth": 12,
    "expYear": 2030,
    "cvv": "123"
  }'
```
```json
{
  "isValid": true,
  "brand": "VISA",
  "luhnValid": true,
  "expirationValid": true,
  "cvvValid": true,
  "errors": []
}
```

#### 3. Validación de Luhn Aislada
* **`POST /api/v1/cards/luhn`**
```bash
curl -X POST http://localhost:3000/api/v1/cards/luhn \
  -H "Content-Type: application/json" \
  -d '{"cardNumber": "5555 5555 5555 4444"}'
```
```json
{
  "luhnValid": true,
  "sanitizedNumber": "5555555555554444"
}
```

#### 4. Detección de Franquicia
* **`POST /api/v1/cards/brand`**
```bash
curl -X POST http://localhost:3000/api/v1/cards/brand \
  -H "Content-Type: application/json" \
  -d '{"cardNumber": "3782-8224-6310-005"}'
```
```json
{
  "brand": "AMEX"
}
```

---

## 🛡️ Trazabilidad SDD (Spec-Driven Development)

Este proyecto fue concebido, auditado y construido siguiendo el marco SDD:

1. **Especificaciones EARS:**
   * Motor Base: [.sdd/specs/SPEC-CARD-VALIDATION.md](.sdd/specs/SPEC-CARD-VALIDATION.md) (L2 Aprobado).
   * API REST: [.sdd/specs/SPEC-CARD-API.md](.sdd/specs/SPEC-CARD-API.md) (L2 Aprobado).
2. **Clarificación Socrática:** [.sdd/specs/SPEC-CARD-API-clarification.md](.sdd/specs/SPEC-CARD-API-clarification.md).
3. **Planes de Arquitectura:** [.sdd/plans/PLAN-CARD-API.md](.sdd/plans/PLAN-CARD-API.md).
4. **Micro-Tareas Verificables:** [.sdd/tasks/TASKS-CARD-API.md](.sdd/tasks/TASKS-CARD-API.md).
5. **Auditoría Clean Code:** Puntuación 100/100 (`sdd review`).

---

## 🧪 Pruebas Unitarias e Integración

```bash
npm.cmd test
```
