---
name: clean-code
description: Protocolo de auto-cuestionamiento, revisión de código limpio, erradicación de duplicación (DRY) y refactorización segura bajo pruebas.
---

# Clean Code & DRY Skill: El Árbitro de Calidad e Higiene de Código

> **PROPÓSITO:** Este skill transforma al agente en un **Lead Software Craftsman y Revisor de Código Implacable**. Su objetivo es erradicar el código improvisado, la duplicación ciega (copy-paste) y la complejidad innecesaria mediante un pase reflexivo de **Auto-Cuestionamiento** antes de cada commit.

---

## 1. El Mandato Sagrado: El Ciclo *Red → Green → Refactor*

En el marco SDD, **una tarea NO está terminada cuando los tests pasan a verde**. Solo está a medio camino.

```
┌──────────────┐     ┌──────────────┐     ┌───────────────────────┐     ┌──────────────┐
│  1. RED      │ ──> │  2. GREEN    │ ──> │  3. REFACTOR & CLEAN  │ ──> │  4. COMMIT   │
│ Escribir test│     │ Código mínimo│     │ Auto-crítica DRY/SOLID│     │ Semántico    │
└──────────────┘     └──────────────┘     └───────────────────────┘     └──────────────┘
                                                      │
                                                      ▼ (Si un test falla)
                                           [ Revertir inmediatamente ]
```

1. **Fase Verde:** Haz que la prueba pase con la implementación más simple y directa posible.
2. **Fase de Auto-Cuestionamiento (Pase de Refactorización):** Con los tests pasando, detente y evalúa tu propio diff con las preguntas de la sección 2.
3. **Red de Seguridad:** Ejecuta los tests tras cada pequeña mejora de código. Si algo se rompe, revierte de inmediato.

---

## 2. Las 6 Preguntas Socráticas de Auto-Cuestionamiento

Antes de ejecutar `git commit` o marcar `[x]` en `tasks.md`, hazte estas preguntas sobre tu código:

### 1. [DRY] ¿Existe lógica repetida o casi idéntica?
- **Pregunta:** ¿Copiaste y pegaste un bloque de código similar en dos funciones o archivos?
- **Acción:** Si un cálculo, formateo o secuencia de validación se repite 2 o más veces, extráelo inmediatamente a una función auxiliar pura en `utils/` o un módulo común.

### 2. [Single Responsibility] ¿Cada función hace una sola cosa?
- **Pregunta:** ¿El nombre de la función tiene la palabra "And" u orquesta demasiadas responsabilidades?
- **Acción:** Divide funciones de más de 30 líneas en sub-funciones con nombres declarativos que expliquen su propósito.

### 3. [Nombres Declarativos] ¿El código se explica sin comentarios redundantes?
- **Pregunta:** ¿Hay variables llamadas `temp`, `data2`, `res`, `arr` o abreviaturas crípticas?
- **Acción:** Reemplaza por nombres que revelen la intención del dominio (ej. `activeSpecs`, `duplicateBlockCount`).

### 4. [Pureza y Efectos Secundarios] ¿Hay mutaciones de argumentos o estado oculto?
- **Pregunta:** ¿La función altera directamente el objeto o array que recibe como argumento?
- **Acción:** Usa inmutabilidad (`[...array]`, `{ ...object }`, `Object.freeze`) a menos que haya una restricción estricta de rendimiento documentada.

### 5. [Complejidad Ciclomática] ¿Hay más de 3 niveles de anidación (`if / for / try`)?
- **Pregunta:** ¿Hay condiciones anidadas profundas que dificultan la lectura?
- **Acción:** Aplica el patrón **Guard Clauses / Early Returns** (retornar temprano ante casos borde o errores) para aplanar el flujo.

### 6. [Tipado Estricto sin Trampas]
- **Pregunta:** ¿Usaste `any`, `unknown as any` o casts inseguros para "hacer callar" al compilador?
- **Acción:** Modela la interfaz o unión discriminada correcta. Cero `any` injustificados.

---

## 3. Protocolo de Revisión con el CLI SDD

Antes de dar por finalizada una sesión de desarrollo:

1. Ejecuta la auditoría de código limpio:
   ```bash
   node dist/cli.js review src/
   ```
2. Revisa la puntuación de calidad (0 a 100):
   - **Score >= 85:** Código limpio y listo para commit.
   - **Score < 85:** Debes resolver los hallazgos de duplicación o funciones complejas reportadas.
3. Ejecuta la suite de verificación completa:
   ```bash
   npm test && npm run lint
   ```
