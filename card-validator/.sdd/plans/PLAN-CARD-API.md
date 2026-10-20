# PLAN-CARD-API: Plan Técnico de Implementación para SPEC-CARD-API

- **Estado:** APPROVED
- **Especificación Asociada:** [SPEC-CARD-API](../specs/SPEC-CARD-API.md)
- **Nivel de Severidad:** L2 (Standard)
- **Fecha:** 2026-10-12

---

## 1. Visión General de la Arquitectura
La API REST se implementará utilizando el módulo nativo `node:http` de Node.js, manteniendo la política de **cero dependencias de producción**. El servidor se diseñará desacoplado mediante una función factoría `createCardServer()` que permite instanciar el servidor en memoria para pruebas automáticas sin colisión de puertos.

```
src/
├── api/
│   ├── router.ts     # Enrutador HTTP y despachador de endpoints
│   ├── handlers.ts   # Controladores de endpoints (health, validate, luhn, brand)
│   └── http-utils.ts # Helpers de parseo de JSON, códigos de error y respuestas
├── server.ts         # Factoría del servidor HTTP (createCardServer)
└── ... (módulos core del validador)
```

---

## 2. Contratos de Rutas y Payloads

| Método | Ruta | Cuerpo de Petición (Request) | Respuesta Exitosa (200) |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | *(vacío)* | `{ status: "ok", timestamp: string, uptime: number }` |
| `POST` | `/api/v1/cards/validate` | `{ cardNumber: string, expMonth?: number, expYear?: number, cvv?: string }` | `CardValidationResult` |
| `POST` | `/api/v1/cards/luhn` | `{ cardNumber: string }` | `{ luhnValid: boolean, sanitizedNumber: string }` |
| `POST` | `/api/v1/cards/brand` | `{ cardNumber: string }` | `{ brand: CardBrand }` |

---

## 3. Estrategia de Testing y Verificación
- **Pruebas de Integración HTTP:**
  - Instanciar el servidor en un puerto efímero dinámico (`port: 0`) durante los tests de Vitest.
  - Usar la API global nativa `fetch` de Node.js para realizar peticiones reales HTTP a cada endpoint.
  - Probar casos de éxito (200) y casos límite/error (400 cuerpo corrupto, 404 ruta inválida, 405 método no permitido, 413 payload excesivo).
  - Cerrar el servidor limpiamente en `afterAll`.
- **Comando de Verificación:**
  - `node ../node_modules/vitest/vitest.mjs run tests/api.test.ts`

---

## 4. Riesgos Técnicos y Mitigaciones
| Riesgo Técnico Identificado | Probabilidad / Impacto | Estrategia de Mitigación |
| :--- | :--- | :--- |
| Ataque DoS por payloads JSON gigantes | Media / Alto | Limitar el stream entrante a 1 MB con corte inmediato y código 413. |
| Colisión de puertos en pruebas simultáneas | Media / Medio | Usar `server.listen(0)` para obtener puertos aleatorios libres del SO. |
| Excepciones no capturadas al parsear JSON | Alta / Alto | Bloque `try / catch` defensivo devolviendo HTTP 400 sin tumbar el proceso. |
