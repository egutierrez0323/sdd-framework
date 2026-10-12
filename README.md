# ⚖ SDD Framework & Autonomous Supervisor

> **Spec-Driven Development (SDD):** El marco de trabajo definitivo para reemplazar el "vibe coding" por un proceso de ingeniería asistida por Inteligencia Artificial estructurado, determinista, auditable y con capacidad de ejecución autónoma segura.

---

## 🌟 ¿Qué es este proyecto?

Este repositorio contiene una **herramienta universal y estándar de trabajo** diseñada para actuar como **Árbitro, Auditor y Supervisor** de cualquier agente de IA (Antigravity, Cursor, Claude Code, GitHub Copilot, Cline, etc.).

No depende de ningún modelo ni proveedor específico: se basa en **Markdown estándar (GFM)**, notación formal **EARS** y un **CLI ligero en TypeScript**.

### Principales Capacidades:
1. **Doble Flujo de Trabajo:**
   - **Greenfield:** Creación de proyectos nuevos con constitución, specs EARS, clarificación y micro-tareas.
   - **Brownfield (Reverse-SDD):** Adopción en cualquier proyecto existente en cualquier punto del desarrollo, escaneando el código para generar su constitución y especificación de línea base (`SPEC-000-BASELINE.md`).
2. **3 Niveles de Severidad del Árbitro:**
   - **L1 (Velocity):** Modo asesor para prototipos y exploración ágil.
   - **L2 (Standard - Recomendado):** EARS estricto, 100% de tareas con tests y comandos de verificación.
   - **L3 (Draconian):** Misión crítica (FinTech/Health), cero ambigüedad tolerada, detección de palabras vagas, análisis obligatorio de resiliencia y seguridad.
3. **Bucle de Ejecución Autónoma Desatendida:**
   - Una vez aprobada la planeación, la IA puede trabajar de forma autónoma tarea por tarea en una rama aislada (`sdd/feature-xxx`).
   - Verificación automatizada por cada micro-tarea.
   - Commits semánticos atómicos.
   - **Rollback seguro:** Si una tarea falla 3 veces consecutivas, el sistema revierte los cambios fallidos a un estado limpio (`git reset/clean`), marca la tarea como `[BLOCKED]` y detiene la ejecución pidiendo intervención humana.
4. **Sincronización Multi-Entorno (Bridges Agnósticos):**
   - Una sola fuente de verdad (`AGENTS.md`) se sincroniza automáticamente con `.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md` y `.agents/rules/`.

---

## 🚀 Instalación y Uso Rápido

### 1. Inicializar en un proyecto nuevo
```bash
# Inicializar con severidad estándar (L2)
node dist/cli.js init --severity L2
```

### 2. Adoptar en un proyecto existente (Reverse-SDD)
```bash
# Analiza dependencias, stack y genera AGENTS.md + SPEC-000
node dist/cli.js reverse
```

### 3. Crear una nueva Especificación
```bash
node dist/cli.js new-spec auth-jwt
```
Esto genera `.sdd/specs/SPEC-AUTH-JWT.md` con la plantilla EARS.

### 4. Someter la especificación al Inquisidor (Clarificación)
```bash
node dist/cli.js clarify .sdd/specs/SPEC-AUTH-JWT.md
```
El Árbitro formula preguntas socráticas sobre casos límite (red, concurrencia, datos vacíos, errores).

### 5. Auditar especificaciones
```bash
node dist/cli.js audit .sdd/specs/SPEC-AUTH-JWT.md
```
Valida sintaxis EARS, criterios Given-When-Then y ausencia de ambigüedades.

### 6. Ejecutar en modo autónomo desatendido
```bash
node dist/cli.js run .sdd/tasks/TASKS-AUTH-JWT.md
```

### 7. Sincronizar reglas con todos tus entornos de IA
```bash
node dist/cli.js sync
```

---

## 📐 Notación EARS (Referencia Rápida)

| Tipo EARS | Sintaxis Obligatoria | Ejemplo |
| :--- | :--- | :--- |
| **Ubicuo** | El sistema **deberá** [capacidad]. | El sistema **deberá** cifrar los tokens en reposo con AES-256. |
| **Event-driven** | **CUANDO** [evento], el sistema **deberá** [respuesta]. | **CUANDO** expire la sesión, el sistema **deberá** redirigir a /login. |
| **State-driven** | **MIENTRAS** [estado], el sistema **deberá** [comportamiento]. | **MIENTRAS** la base de datos esté en mantenimiento, el sistema **deberá** retornar 503. |
| **Unwanted Behavior** | **SI** [error], **ENTONCES** el sistema **deberá** [recuperación]. | **SI** la API externa excede 3s, **ENTONCES** el sistema **deberá** usar la caché local. |
| **Optional** | **DONDE** [función activa], el sistema **deberá** [capacidad]. | **DONDE** biometric_auth sea true, el sistema **deberá** permitir login con huella. |

---

## 🧪 Pruebas del Framework

```bash
# Ejecutar suite completa de tests unitarios
npm test

# Compilar proyecto TypeScript
npm run build
```

---

## 📂 Estructura del Repositorio

```
├── .sdd/
│   ├── specs/                  # Especificaciones (EARS)
│   ├── plans/                  # Planes técnicos y contratos
│   ├── tasks/                  # Micro-tareas atómicas con verifyCommand
│   └── templates/              # Plantillas maestras reutilizables
├── .agents/
│   ├── skills/sdd-methodology/ # Skill nativo para asistentes de IA
│   └── rules/sdd-rules.md      # Reglas sincronizadas
├── src/
│   ├── cli.ts                  # CLI ejecutable universal
│   ├── core/                   # Validador EARS, Reverse Engine, Auto Runner, Bridges
│   └── utils/                  # Git client, Logger con roles, FS helpers
└── tests/                      # Suite de tests con Vitest
```
