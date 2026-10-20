# SPEC-CARD-API: API REST de Validación de Tarjetas de Crédito

- **Estado:** APPROVED
- **Fecha:** 2026-10-12
- **Nivel de Severidad:** L2 (Standard)

---

## 1. Contexto y Justificación
Para convertir el motor de validación en un producto de software consumible por aplicaciones web, pasarelas de pago y servicios externos, se requiere exponer una API REST HTTP ligera, síncrona y de alto rendimiento. Esta API procesa peticiones en formato JSON, no introduce dependencias de ejecución externas y responde con códigos de estado HTTP estándar.

---

## 2. Requerimientos del Sistema (Notación EARS)

### REQ-API-01: Endpoint de Diagnóstico y Estado del Servicio
- **Tipo EARS:** Event-driven
- **Declaración:**
  > CUANDO un cliente envía una solicitud HTTP GET a /health, el sistema deberá responder con código 200 OK y un payload JSON indicando el estado del servicio y timestamp.
- **Criterio de Aceptación:**
  - **DADO:** El servidor HTTP iniciado y escuchando peticiones.
  - **CUANDO:** Se recibe una solicitud GET en la ruta /health.
  - **ENTONCES:** El sistema deberá devolver HTTP 200 con encabezado Content-Type application/json y un objeto con status 'ok' y marca de tiempo ISO.

### REQ-API-02: Endpoint de Validación Integral de Tarjetas
- **Tipo EARS:** Event-driven
- **Declaración:**
  > CUANDO un cliente envía una solicitud HTTP POST a /api/v1/cards/validate con los datos de una tarjeta, el sistema deberá orquestar la validación completa y responder con el diagnóstico tipado y código 200 OK.
- **Criterio de Aceptación:**
  - **DADO:** Un cuerpo JSON con cardNumber y campos opcionales expMonth, expYear y cvv.
  - **CUANDO:** Se ejecuta la validación integral del motor de tarjetas.
  - **ENTONCES:** El sistema deberá retornar código 200 OK y el objeto CardValidationResult con isValid, brand, luhnValid, expirationValid, cvvValid y lista de errores.

### REQ-API-03: Endpoint Rápido de Algoritmo de Luhn
- **Tipo EARS:** Event-driven
- **Declaración:**
  > CUANDO un cliente envía una solicitud HTTP POST a /api/v1/cards/luhn con un número de tarjeta, el sistema deberá verificar la validez matemática del número y responder con el resultado.
- **Criterio de Aceptación:**
  - **DADO:** Un payload JSON con el atributo cardNumber.
  - **CUANDO:** Se sanitiza y verifica el dígito de control de Luhn (Módulo 10).
  - **ENTONCES:** El sistema deberá devolver código 200 OK con un objeto que contenga luhnValid y sanitizedNumber.

### REQ-API-04: Endpoint de Detección de Franquicia Emisora
- **Tipo EARS:** Event-driven
- **Declaración:**
  > CUANDO un cliente envía una solicitud HTTP POST a /api/v1/cards/brand con un número de tarjeta, el sistema deberá identificar la red de la tarjeta y responder con la franquicia correspondiente.
- **Criterio de Aceptación:**
  - **DADO:** Un payload JSON con cardNumber.
  - **CUANDO:** Se evalúa el prefijo IIN/BIN y la longitud esperada.
  - **ENTONCES:** El sistema deberá retornar código 200 OK con un objeto indicando brand ('VISA', 'MASTERCARD', 'AMEX', 'DISCOVER' o 'UNKNOWN').

### REQ-API-05: Manejo Resiliente de Errores de Protocolo y Cuerpos Inválidos
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > SI la solicitud contiene un cuerpo JSON malformado o apunta a una ruta no registrada, ENTONCES el sistema deberá responder con el código de error HTTP adecuado (400 o 404) sin causar caídas en el servidor.
- **Criterio de Aceptación:**
  - **DADO:** Una petición HTTP con sintaxis JSON inválida o una URL no soportada.
  - **CUANDO:** El enrutador procesa la solicitud entrante.
  - **ENTONCES:** El sistema deberá responder con status 400 (Bad Request) o 404 (Not Found) y un mensaje explicativo en formato JSON.
