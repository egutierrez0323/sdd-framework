# Mapa Visual de Arquitectura y Grafo de Dependencias

> **MÉTRICAS DE TOKENS:**
> - Archivos analizados: **21**
> - Símbolos exportados: **15**
> - Tokens código fuente completo: ~**7269** tokens
> - Tokens del grafo compacto: ~**455** tokens
> - **Ahorro de Tokens: 94%**

```mermaid
graph TD
  src_api_handlers_ts["handlers.ts<br/>(handleHealth)"]
  src_api_http_utils_ts["http-utils.ts<br/>(DEFAULT_MAX_BODY_BYTES, ApiErrorResponse, sendJson...)"]
  src_api_router_ts["router.ts<br/>()"]
  src_bin_server_ts["server.ts<br/>()"]
  src_brands_ts["brands.ts<br/>(detectCardBrand)"]
  src_cvv_ts["cvv.ts<br/>(validateCvv)"]
  src_expiration_ts["expiration.ts<br/>(validateExpiration)"]
  src_index_ts["index.ts<br/>()"]
  src_luhn_ts["luhn.ts<br/>(validateLuhn)"]
  src_sanitizer_ts["sanitizer.ts<br/>(sanitizeCardNumber)"]
  src_server_ts["server.ts<br/>(createCardServer)"]
  src_types_ts["types.ts<br/>(CardBrand, CardInput, CardValidationResult)"]
  src_validator_ts["validator.ts<br/>(validateCreditCard)"]
  tests_api_test_ts["api.test.ts<br/>()"]
  tests_brands_test_ts["brands.test.ts<br/>()"]
  tests_cvv_test_ts["cvv.test.ts<br/>()"]
  tests_expiration_test_ts["expiration.test.ts<br/>()"]
  tests_http_utils_test_ts["http-utils.test.ts<br/>()"]
  tests_luhn_test_ts["luhn.test.ts<br/>()"]
  tests_sanitizer_test_ts["sanitizer.test.ts<br/>()"]
  tests_validator_test_ts["validator.test.ts<br/>()"]
```

## Índice Semántico Ultracompacto de Contexto

| Módulo | Símbolos Exportados | Dependencias Clave |
| :--- | :--- | :--- |
| `src/api/handlers.ts` | `handleHealth` | `http-utils.js`, `validator.js`, `luhn.js`, `sanitizer.js`, `brands.js`, `types.js` |
| `src/api/http-utils.ts` | `DEFAULT_MAX_BODY_BYTES`, `ApiErrorResponse`, `sendJson`, `createErrorResponse` | *(ninguna)* |
| `src/api/router.ts` | *(interno)* | `handlers.js`, `http-utils.js` |
| `src/bin/server.ts` | *(interno)* | `server.js` |
| `src/brands.ts` | `detectCardBrand` | `types.js` |
| `src/cvv.ts` | `validateCvv` | `types.js` |
| `src/expiration.ts` | `validateExpiration` | *(ninguna)* |
| `src/index.ts` | *(interno)* | *(ninguna)* |
| `src/luhn.ts` | `validateLuhn` | *(ninguna)* |
| `src/sanitizer.ts` | `sanitizeCardNumber` | *(ninguna)* |
| `src/server.ts` | `createCardServer` | `router.js` |
| `src/types.ts` | `CardBrand`, `CardInput`, `CardValidationResult` | *(ninguna)* |
| `src/validator.ts` | `validateCreditCard` | `types.js`, `sanitizer.js`, `luhn.js`, `brands.js`, `expiration.js`, `cvv.js` |
| `tests/api.test.ts` | *(interno)* | `server.js` |
| `tests/brands.test.ts` | *(interno)* | `brands.js` |
| `tests/cvv.test.ts` | *(interno)* | `cvv.js` |
| `tests/expiration.test.ts` | *(interno)* | `expiration.js` |
| `tests/http-utils.test.ts` | *(interno)* | `http-utils.js` |
| `tests/luhn.test.ts` | *(interno)* | `luhn.js` |
| `tests/sanitizer.test.ts` | *(interno)* | `sanitizer.js` |
| `tests/validator.test.ts` | *(interno)* | `validator.js` |
