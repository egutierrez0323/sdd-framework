# Guía Rápida de Notación EARS (Easy Approach to Requirements Syntax)

La notación EARS elimina la ambigüedad en los requerimientos usando 5 patrones sintácticos estrictos:

| Tipo de Requisito | Patrón Sintáctico | Ejemplo |
| :--- | :--- | :--- |
| **Ubicuo (Ubiquitous)** | El sistema **deberá** [acción/capacidad]. | El sistema **deberá** almacenar todos los registros en formato UTF-8. |
| **Dirigido por Eventos (Event-driven)** | **CUANDO** [evento/disparador], el sistema **deberá** [respuesta]. | **CUANDO** el usuario presiona "Exportar", el sistema **deberá** generar un archivo PDF en < 2 segundos. |
| **Dirigido por Estado (State-driven)** | **MIENTRAS** [estado del sistema], el sistema **deberá** [comportamiento continuo]. | **MIENTRAS** el dispositivo esté sin conexión a Internet, el sistema **deberá** almacenar las transacciones en la cola local cifrada. |
| **Comportamiento No Deseado (Unwanted Behavior)** | **SI** [condición de error/excepción], **ENTONCES** el sistema **deberá** [respuesta de recuperación]. | **SI** la respuesta del servidor excede 5000 ms, **ENTONCES** el sistema **deberá** reintentar la petición hasta 3 veces con retroceso exponencial. |
| **Opcional (Optional Feature)** | **DONDE** [función habilitada o parámetro activo], el sistema **deberá** [capacidad]. | **DONDE** la autenticación biométrica esté soportada por el hardware, el sistema **deberá** ofrecer inicio de sesión por huella o rostro. |

---

## Estructura de Criterios de Aceptación (Given-When-Then / Gherkin)
Para cada requisito crítico, incluye al menos un escenario verificable:
- **DADO (Given):** El contexto o estado inicial previo a la acción.
- **CUANDO (When):** La acción ejecutada por el actor o sistema.
- **ENTONCES (Then):** El resultado observable esperado y verificable.
