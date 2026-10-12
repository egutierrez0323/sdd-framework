<!-- SINCRONIZADO AUTOMÁTICAMENTE DESDE AGENTS.md (SDD FRAMEWORK) -->

# Constitución del Proyecto: SDD Framework (Spec-Driven Development)

> **PROPÓSITO:** Esta constitución establece las directrices innegociables y principios arquitectónicos para el desarrollo y mantenimiento del marco de trabajo SDD. Cualquier agente de Inteligencia Artificial que opere en este repositorio DEBE acatar estrictamente estas reglas.

---

## 1. Principio Fundamental: La Especificación es la Fuente de Verdad

1. **Prohibido el Vibe Coding:** Ninguna línea de código de producción será generada sin un requisito previo (`REQ-ID`) documentado en una especificación aprobada y una micro-tarea asignada en `tasks.md`.
2. **Determinismo sobre Intuición:** Ante la duda entre dos enfoques técnicos, siempre se preferirá aquel que sea medible, testeable y alineado con los requerimientos EARS.
3. **Inmutabilidad del Alcance en Ejecución:** Una vez que una especificación y un plan son aprobados, el agente de IA **NO TIENE PERMITIDO** modificar el alcance, agregar librerías no planificadas o alterar firmas de contratos públicos sin intervención humana explícita.

---

## 2. Los 3 Niveles de Severidad del Árbitro / Supervisor

El sistema soporta tres intensidades de auditoría configurables:

| Nivel | Nombre | Criterio de Aprobación | Exigencia de Tests | Intervención Humana |
| :--- | :--- | :--- | :--- | :--- |
| **L1** | **Pragmatic (Velocity)** | Revisión de coherencia general y sintaxis básica. Sugerencias no bloqueantes. | Tests mínimos de humo / verificación funcional básica. | Al inicio (Spec) y al final de la entrega. |
| **L2** | **Standard (Production)** | Notación EARS estricta, trazabilidad 1:1 de Requisito ↔ Tarea, contratos de datos definidos. | Cobertura de tests unitarios/integración por cada micro-tarea. | Al aprobar Plan y en cambios arquitectónicos. |
| **L3** | **Draconian (Mission-Critical)** | Cero ambigüedad tolerable, análisis de casos borde exhaustivo, modelado de amenazas de seguridad (OWASP/CWE), invariantes formales. | Cobertura estricta con casos límite (edge cases) y tests de regresión antes de cada commit. | En cada compuerta de fase (Gatekeeper). |

---

## 3. Protocolo de Ejecución Autónoma Desatendida

1. **Compuerta de Arranque:** La IA solo puede entrar en modo autónomo desatendido (ej. vía `/goal` o loop continuo) **DESPUÉS** de que:
   - `spec.md` esté en estado `APPROVED`.
   - `plan.md` esté en estado `APPROVED`.
   - `tasks.md` contenga micro-tareas secuenciales, atómicas (estimadas en ≤ 30 min cada una) con un comando de validación ejecutable (`verify`).
2. **Ciclo por Micro-Tarea:**
   - Cargar únicamente el contexto relevante a la tarea actual.
   - Implementar el código y/o test correspondiente.
   - Ejecutar la verificación automatizada.
   - Si la verificación falla: Máximo **3 ciclos de auto-corrección**. Si persiste el fallo, la IA debe pausar y emitir un reporte de bloqueo con la causa raíz.
   - Si la verificación pasa: Marcar `[x]` en `tasks.md`, realizar commit semántico (`feat(REQ-X): descripcion`) y pasar a la siguiente tarea.

---

## 4. Filosofía de Diseño de la Herramienta

1. **Agnosticismo de Modelos y Proveedores:** El formato de especificación debe basarse en **Markdown estándar (GFM)** y esquemas JSON legibles por humanos y por cualquier LLM (Gemini, Claude, GPT, DeepSeek, etc.).
2. **Cero Fricción en Adopción:**
   - La herramienta debe poder utilizarse simplemente copiando la carpeta `.sdd/` a cualquier repositorio.
   - El CLI oficial (`sdd`) actuará como asistente, linter y orquestador multiplataforma (Windows, Linux, macOS).
3. **Soporte Greenfield y Brownfield:** El marco debe contemplar tanto la creación de software desde cero como la adopción en proyectos heredados mediante ingeniería inversa de especificaciones (*Reverse-SDD*).

---

## 5. Convenciones de Código y Calidad para Este Repositorio

- **Lenguaje:** TypeScript (Node.js LTS, ESM).
- **Tipado:** Estricto (`strict: true`), sin uso de `any` injustificado.
- **Formato y Estilo:** Prettier y ESLint con estándares limpios y legibles.
- **Testing:** Vitest / Node test runner para pruebas rápidas y deterministas.
- **Documentación:** Todo cambio estructural debe reflejarse en la carpeta `.sdd/` y en el `README.md`.
