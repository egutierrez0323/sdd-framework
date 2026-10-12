# SPEC-001: Motor y Framework Universal de Spec-Driven Development (SDD)

- **Estado:** APPROVED
- **Fecha de Creación:** 2026-10-12
- **Nivel de Severidad:** L2 (Standard)
- **Autor / Responsable:** Antigravity & Usuario
- **Módulo / Dominio:** SDD Core Tooling & Autonomous Supervisor

---

## 1. Contexto y Justificación (El "Por Qué")
El desarrollo con IA asistida sufre de deriva de contexto, "vibe coding", alucinaciones arquitectónicas y falta de trazabilidad. Se requiere una herramienta y estándar universal que actúe como supervisor, auditor y facilitador del flujo SDD (Constitución -> Especificación EARS -> Clarificación Supervisada -> Plan -> Tareas -> Ejecución Autónoma Verificable). La herramienta debe operar tanto en repositorios nuevos como en sistemas existentes (*brownfield*), sin atarse a ningún proveedor de IA específico.

---

## 2. Requerimientos del Sistema (Notación EARS)

### REQ-001-01: Inicialización de Repositorio (Greenfield)
- **Tipo EARS:** Event-driven
- **Declaración:**
  > **CUANDO** el usuario ejecute `sdd init` en un proyecto vacío o nuevo, el sistema **deberá** crear la estructura base `.sdd/` (plantillas, configuración, carpetas de specs/plans/tasks) y el archivo de constitución `AGENTS.md` adaptado a la severidad elegida (L1, L2 o L3).
- **Criterio de Aceptación:**
  - **DADO:** Un directorio de proyecto sin inicializar.
  - **CUANDO:** Se ejecuta el comando de inicialización seleccionando nivel L2.
  - **ENTONCES:** Se generan los directorios `.sdd/{specs,plans,tasks,templates}`, el archivo `AGENTS.md` y la configuración `sdd.config.json` con el nivel L2 persistido.

### REQ-001-02: Ingeniería Inversa en Repositorios Existentes (Brownfield / Reverse-SDD)
- **Tipo EARS:** Event-driven
- **Declaración:**
  > **CUANDO** el usuario ejecute `sdd reverse` en un repositorio existente con código fuente, el sistema **deberá** escanear la estructura de archivos, dependencias y scripts de prueba para generar automáticamente una propuesta de `AGENTS.md` y una especificación base (`SPEC-000-BASELINE.md`) a nivel de Arquitectura y Superficie Pública.
- **Criterio de Aceptación:**
  - **DADO:** Un repositorio existente con código legacy y `package.json` (u otro gestor de dependencias).
  - **CUANDO:** Se ejecuta `sdd reverse`.
  - **ENTONCES:** Se genera un mapa de arquitectura del código actual y un borrador de `AGENTS.md` que documenta las convenciones observadas sin alterar el código existente.

### REQ-001-03: Niveles de Severidad del Árbitro
- **Tipo EARS:** State-driven
- **Declaración:**
  > **MIENTRAS** el nivel de severidad configurado sea L3 (Draconian), el sistema **deberá** bloquear la transición de una especificación a la fase de planificación si existen requerimientos sin sintaxis EARS formal, sin criterios Given-When-Then, o si no se ha superado la ronda de preguntas de clarificación.
- **Criterio de Aceptación:**
  - **DADO:** Una especificación con requerimientos en lenguaje informal y severidad L3.
  - **CUANDO:** Se ejecuta la validación/auditoría de la especificación.
  - **ENTONCES:** El validador devuelve errores bloqueantes con código de salida no cero indicando las líneas que no cumplen EARS.

### REQ-001-04: Fase de Clarificación Supervisada (El Inquisidor)
- **Tipo EARS:** Event-driven
- **Declaración:**
  > **CUANDO** el usuario solicite clarificar una especificación (`sdd clarify <id>`), el sistema **deberá** analizar la especificación y formular entre 3 y 5 preguntas de alto impacto sobre casos límite, errores no contemplados, concurrencia o límites de rendimiento.
- **Criterio de Aceptación:**
  - **DADO:** Un borrador de especificación `SPEC-XXX.md`.
  - **CUANDO:** Se ejecuta el comando de clarificación.
  - **ENTONCES:** Se genera una sesión/documento de clarificación estructurado con preguntas que desafían los supuestos de la spec antes de redactar el plan.

### REQ-001-05: Protocolo de Ejecución Autónoma Desatendida
- **Tipo EARS:** State-driven
- **Declaración:**
  > **MIENTRAS** el sistema se encuentre en modo de ejecución autónoma sobre un archivo `TASKS-XXX.md` aprobado, el sistema **deberá** operar sobre una rama de trabajo aislada (`sdd/feature-xxx`), iterar sobre cada tarea incompleta secuencialmente, ejecutar el comando de verificación y realizar un commit atómico semántico por cada tarea completada.
- **Criterio de Aceptación:**
  - **DADO:** Un archivo `TASKS-XXX.md` con 3 tareas pendientes y un comando de test unitario asociado.
  - **CUANDO:** Se inicia la ejecución autónoma.
  - **ENTONCES:** La IA crea la rama de trabajo, resuelve cada tarea, ejecuta la verificación, realiza el commit semántico (`feat(REQ-X): TASK-Y completada`) y avanza hasta finalizar todas las tareas.

### REQ-001-06: Gestión de Errores en Ejecución Autónoma (Unwanted Behavior)
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > **SI** la ejecución del comando de verificación falla de forma continua tras 3 intentos de auto-corrección en una micro-tarea, **ENTONCES** el sistema **deberá** revertir limpiamente los cambios fallidos de esa tarea (git reset/clean), marcar la tarea como `BLOCKED` en `tasks.md`, emitir un reporte de diagnóstico con causa raíz y detener la ejecución desatendida para solicitar intervención humana.
- **Criterio de Aceptación:**
  - **DADO:** Una tarea cuyo test no puede satisfacerse tras 3 intentos.
  - **CUANDO:** Falla el 3er intento de verificación.
  - **ENTONCES:** El espacio de trabajo se revierte al último commit limpio, la tarea queda marcada como `BLOCKED` y la ejecución desatendida se detiene de forma segura.

### REQ-001-07: Adaptadores Multi-Plataforma (Bridges Agnósticos)
- **Tipo EARS:** Optional
- **Declaración:**
  > **DONDE** se configuren adaptadores de entorno en `sdd.config.json` (Antigravity, Cursor, Claude Code, GitHub Copilot), el sistema **deberá** generar y mantener sincronizados los archivos de reglas correspondientes (`.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.agents/skills`) a partir del archivo único de verdad `AGENTS.md`.
- **Criterio de Aceptación:**
  - **DADO:** Una actualización en las reglas de `AGENTS.md`.
  - **CUANDO:** Se ejecuta `sdd sync` (o durante la inicialización).
  - **ENTONCES:** Los archivos de reglas de cada proveedor configurado se actualizan reflejando las mismas directrices sin inconsistencias.

---

## 3. Límites y Restricciones (Out of Scope & Constraints)
- **Fuera de Alcance:**
  - No se construirá un servidor web ni interfaz gráfica pesada en esta fase inicial; la interacción será mediante CLI de terminal y archivos Markdown locales.
  - No se almacenarán datos en servidores externos; toda la información reside 100% en el sistema de archivos del usuario.
- **Restricciones Técnicas:**
  - Implementación en TypeScript (Node.js 18+).
  - Cero dependencias externas pesadas en tiempo de ejecución (máxima velocidad de instalación y ejecución en `npx`).
  - Compatible nativamente con Windows (PowerShell/CMD), macOS y Linux.

---

## 4. Registro de Clarificación y Validación (El Árbitro)
| Pregunta / Caso Límite Evaluado | Decisión Tomada | Impacto en la Spec |
| :--- | :--- | :--- |
| **Respuesta ante 3 fallos consecutivos en ejecución autónoma** | Revertir limpiamente cambios fallidos (git reset/clean), marcar `BLOCKED` en tasks y detener la ejecución pidiendo feedback. | Incorporado en REQ-001-06 |
| **Estrategia de ramas y commits en ejecución desatendida** | Crear rama aislada `sdd/feature-xxx` y emitir commits atómicos semánticos por cada tarea exitosa. | Incorporado en REQ-001-05 |
| **Alcance del Reverse-SDD en proyectos brownfield** | Enfocarse en Arquitectura y Superficie Pública (Stack, scripts, modelos, APIs y convenciones) sin sobrecargar con funciones internas. | Incorporado en REQ-001-02 |

