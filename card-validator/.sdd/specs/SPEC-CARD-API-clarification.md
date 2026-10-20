# Registro de Clarificación Socrática: SPEC-CARD-API.md

> **EL ÁRBITRO SDD (ROL: INQUISIDOR):** Registro de resolución de preguntas antes de la fase de Planificación (`plan.md`).

### [CLARIFY-02] (Data Boundaries)
**Pregunta Incómoda:** ¿Cómo debe comportarse el sistema si las entradas son listas vacías, strings vacíos o superan el tamaño esperado?

**Recomendación del Árbitro:** Definir explícitamente en los criterios de aceptación el estado devuelto ante colecciones vacías o límites de tamaño.

**Decisión Acordada:** El servidor limita el payload HTTP a 1 MB para mitigar ataques DoS. Cuerpos vacíos o sintácticamente corruptos responden 400 Bad Request (`{ error: 'Cuerpo de solicitud inválido o no es JSON' }`). Cuerpos que excedan 1 MB responden 413 Payload Too Large.

---

### [CLARIFY-04] (Performance)
**Pregunta Incómoda:** ¿Existen restricciones de tiempo de respuesta (SLAs) o concurrencia máxima esperada?

**Recomendación del Árbitro:** Cuantificar los tiempos máximos tolerables (ej: < 200ms para APIs, < 2s para reportes) en los criterios EARS.

**Decisión Acordada:** Latencia promedio por petición < 5 ms en pruebas locales, con soporte concurrente nativo gracias al loop de eventos asíncrono de Node.js.

---
