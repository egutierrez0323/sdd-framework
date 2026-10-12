# SPEC-CARD-VALIDATION: Validador Universal de Tarjetas de Crédito

- **Estado:** APPROVED
- **Fecha:** 2026-10-12
- **Nivel de Severidad:** L2 (Standard)

---

## 1. Contexto y Justificación
El procesamiento de pagos y formularios de checkout requiere verificar la integridad sintáctica y matemática de los datos de tarjetas de crédito (número, marca, fecha de vencimiento y código de seguridad) antes de enviar las transacciones a pasarelas de pago externas. Esto evita cobros fallidos, cargos innecesarios de API y mejora la experiencia de usuario con validaciones en tiempo real y tipado estricto en TypeScript.

---

## 2. Requerimientos del Sistema (Notación EARS)

### REQ-CARD-01: Sanitización y Normalización de Entrada
- **Tipo EARS:** Ubiquitous
- **Declaración:**
  > El sistema deberá limpiar espacios en blanco, guiones y caracteres de formato al procesar un número de tarjeta de crédito.
- **Criterio de Aceptación:**
  - **DADO:** Una cadena de texto con número de tarjeta que contiene espacios o guiones (ej. "4532 - 1234 - 5678 - 9010").
  - **CUANDO:** Se procesa la cadena para normalización.
  - **ENTONCES:** El sistema deberá retornar únicamente los dígitos continuos sin caracteres no numéricos.

### REQ-CARD-02: Validación Matemática con Algoritmo de Luhn (Mod 10)
- **Tipo EARS:** Event-driven
- **Declaración:**
  > CUANDO se recibe un número de tarjeta normalizado, el sistema deberá verificar el dígito de control mediante el algoritmo de Luhn (módulo 10).
- **Criterio de Aceptación:**
  - **DADO:** Un número de tarjeta con longitud válida entre 13 y 19 dígitos.
  - **CUANDO:** Se duplican dígitos alternados de derecha a izquierda y se suman las cifras resultantes.
  - **ENTONCES:** El sistema deberá retornar true si la suma total es múltiplo de 10, o false si no lo es.

### REQ-CARD-03: Detección de Franquicia o Red Emisora
- **Tipo EARS:** Event-driven
- **Declaración:**
  > CUANDO se evalúa un número de tarjeta, el sistema deberá identificar la red emisora (Visa, Mastercard, American Express o Discover) a partir del prefijo IIN/BIN y la longitud esperada.
- **Criterio de Aceptación:**
  - **DADO:** Un número de tarjeta normalizado.
  - **CUANDO:** Coincide con los patrones IIN (Visa empieza por 4; Mastercard por 51-55 o 2221-2720; Amex por 34 o 37; Discover por 6011, 65 o 644-649).
  - **ENTONCES:** El sistema deberá retornar el identificador de la franquicia correspondiente o 'UNKNOWN' si no coincide con ninguna admitida.

### REQ-CARD-04: Validación de Fecha de Expiración
- **Tipo EARS:** Event-driven
- **Declaración:**
  > CUANDO se evalúa una fecha de expiración con mes (1-12) y año, el sistema deberá verificar que corresponda al mes corriente o a una fecha futura.
- **Criterio de Aceptación:**
  - **DADO:** Un mes entre 1 y 12 y un año en formato de 2 o 4 dígitos.
  - **CUANDO:** Se compara el último día del mes especificado contra la fecha actual del sistema.
  - **ENTONCES:** El sistema deberá retornar true si la tarjeta aún está vigente y false si la fecha ya caducó o los valores numéricos son inválidos.

### REQ-CARD-05: Validación de Código de Seguridad CVV / CVC
- **Tipo EARS:** Event-driven
- **Declaración:**
  > CUANDO se valida un código CVV/CVC junto a la red emisora, el sistema deberá comprobar que su longitud numérica sea exactamente de 4 dígitos para American Express y de 3 dígitos para el resto de franquicias.
- **Criterio de Aceptación:**
  - **DADO:** Una cadena numérica que representa el código de seguridad y la marca de la tarjeta detectada.
  - **CUANDO:** Se evalúa la longitud y composición del CVV.
  - **ENTONCES:** El sistema deberá retornar true si cumple la longitud exacta (4 dígitos para Amex, 3 dígitos para Visa/Mastercard/Discover) y false en caso contrario.

### REQ-CARD-06: Manejo de Entradas Inválidas o Datos Corruptos
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > SI la entrada es nula, vacía o contiene caracteres no procesables, ENTONCES el sistema deberá rechazar la validación sin arrojar excepciones no controladas.
- **Criterio de Aceptación:**
  - **DADO:** Un valor null, undefined, cadena vacía o con letras.
  - **CUANDO:** Se ejecuta la función de validación.
  - **ENTONCES:** El sistema deberá retornar un resultado con isValid en false y una lista con la descripción del error.

### REQ-CARD-07: Validación Consolidada de Tarjeta
- **Tipo EARS:** Event-driven
- **Declaración:**
  > CUANDO se invoca la validación completa de una tarjeta con número, expiración y CVV, el sistema deberá devolver un informe integral con la validez global y el desglose de cada comprobación.
- **Criterio de Aceptación:**
  - **DADO:** Un objeto con número de tarjeta, mes y año de expiración, y código de seguridad CVV opcional.
  - **CUANDO:** Se ejecuta el método principal de validación consolidada.
  - **ENTONCES:** El sistema deberá devolver un objeto CardValidationResult con isValid global, franquicia detectada y los resultados individuales de Luhn, expiración y CVV.
