# ⚖️ SDD Framework: Spec-Driven Development

[![CI Quality Gate](https://github.com/egutierrez0323/sdd-framework/actions/workflows/ci.yml/badge.svg)](https://github.com/egutierrez0323/sdd-framework/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest%20100%25-green)](https://vitest.dev/)

> **Stop Vibe Coding. Start Spec-Driven Engineering.**  
> El marco de trabajo universal para convertir el desarrollo asistido por Inteligencia Artificial en un proceso determinista, medible, auditable y con ejecución autónoma verificable.

---

## 🎯 El Problema: El "Vibe Coding" no escala en producción

Programar con agentes de IA (Cursor, Claude Code, Antigravity, GitHub Copilot) sin un marco de trabajo formal genera:
- 🍝 **Código espagueti y alucinaciones:** librerías inventadas o arquitecturas incoherentes.
- 💸 **Quema descontrolada de tokens:** contextos gigantescos cargados sin dirección.
- 💔 **Regresiones silenciosas:** la IA modifica código existente o rompe contratos públicos sin avisar.
- 🤖 **Complacencia artificial (*AI Sycophancy*):** la IA actúa como un *"yes-man"*, aceptando decisiones erróneas del desarrollador sin desafiarlas.

**SDD resuelve esto de raíz:** La especificación es la única fuente de verdad. Ningún agente escribe código de producción sin un requisito formal (`REQ-ID`) y una micro-tarea con comando de verificación.

---

## ⚡ Inicio Rápido (Zero Install vía `npx`)

No necesitas clonar este repositorio para usarlo en tus proyectos. Ejecuta en la raíz de cualquier proyecto (sea Node.js, Python, Go, Rust o nuevo):

```bash
# 1. Inicializa el entorno con el Wizard interactivo
npx sdd-framework init
```

El asistente detectará automáticamente si es un proyecto nuevo (**Greenfield**) o existente (**Brownfield / Reverse-SDD**), configurará la severidad del Árbitro (`L1`, `L2`, `L3`) y sincronizará las reglas para tus editores (`.cursorrules`, `CLAUDE.md`, `AGENTS.md`).

---

## 🖥️ Visualizador Web & Dashboard (`npx sdd-framework ui`)

¿No quieres leer archivos Markdown en crudo? Abre el visualizador web interactivo:

```bash
npx sdd-framework ui
# o
npx sdd-framework view
```

```text
✔ Servidor local iniciado con éxito.
🌐 Dashboard interactivo: http://localhost:3333
🚀 Abriendo navegador...
```

### Capacidades del Visualizador:
- 📊 **Métricas en tiempo real:** KPIs de especificaciones (`APPROVED` vs `DRAFT`), desglose de requerimientos por patrón EARS y progreso porcentual de tareas.
- 📄 **Explorador de Especificaciones:** Tarjetas interactivas con badges para requerimientos y criterios de aceptación (**DADO / CUANDO / ENTONCES**).
- 📋 **Checklist de Micro-Tareas:** Barra de progreso reactiva, estado de cada tarea (`DONE`, `PENDING`, `BLOCKED`) y comando de verificación.
- 🗺️ **Grafo Arquitectónico y Constitución:** Visualización del mapa de dependencias para optimizar tokens.
- 🖨️ **Modo Impresión Ejecutivo / PDF:** Presiona `Ctrl + P` o haz clic en *"Imprimir / PDF"* para generar un informe técnico impecable listo para clientes, gerencia o auditorías.

---

## 🛠️ Arsenal del Framework

### 1. Interrogatorio Socrático & Modo Grill-Me (`sdd grill`)
El Árbitro somete tu especificación a un interrogatorio interactivo en la terminal antes de escribir una sola línea de código:
```bash
npx sdd-framework grill .sdd/specs/SPEC-AUTH-JWT.md
```
- **Auto-Grill de la IA previo:** La IA auto-resuelve con el código existente lo que ya esté implementado, reduciendo el ruido para el líder humano.
- **Anti-Complacencia (*Devil's Advocate*):** Si el líder propone una solución peligrosa (ej. devolver `200 OK` en fallos de autenticación, guardar tokens en texto plano o saltarse tests), el Árbitro emite una alerta bloqueante y exige confirmación consciente.

### 2. Auditoría EARS del Árbitro (`sdd audit`)
```bash
npx sdd-framework audit
```
Verifica que las especificaciones cumplan estrictamente los 5 patrones EARS y bloquea palabras vagas (*"rápido"*, *"fácil"*, *"óptimo"*, *"etc."*).

### 3. Grafo de Arquitectura y Ahorro de Tokens (`sdd graph`)
```bash
npx sdd-framework graph
```
Indexa AST, imports y exports del proyecto en un grafo semántico ultracompacto (`.sdd/architecture-graph.md`), **reduciendo el consumo de tokens de tus prompts entre un 80% y 95%**.

### 4. Bucle de Ejecución Autónoma Desatendida (`sdd run`)
```bash
npx sdd-framework run .sdd/tasks/TASKS-AUTH-JWT.md
```
- Ejecuta las micro-tareas secuencialmente en un ciclo *Red → Green → Refactor*.
- Verifica cada tarea con comandos de prueba reales (`vitest`, `pytest`, etc.).
- **Rollback seguro:** Máximo 3 intentos de auto-corrección; si persiste el error, revierte los cambios limpios (`git reset/clean`), marca `[BLOCKED]` y solicita intervención humana.

### 5. Auditoría de Código Limpio y DRY (`sdd review`)
```bash
npx sdd-framework review src/
```
Evalúa duplicación de código (DRY), funciones monolíticas y asigna una puntuación de salud de 0 a 100.

---

## 📐 Notación EARS (Easy Approach to Requirements Syntax)

| Tipo EARS | Sintaxis Obligatoria | Ejemplo Real |
| :--- | :--- | :--- |
| **Ubicuo** | *El sistema **deberá** [acción].* | *El sistema **deberá** almacenar todos los registros en formato UTF-8.* |
| **Event-driven** | ***CUANDO** [evento], el sistema **deberá** [respuesta].* | ***CUANDO** se envía POST /login válido, el sistema **deberá** emitir un JWT.* |
| **State-driven** | ***MIENTRAS** [estado], el sistema **deberá** [comportamiento].* | ***MIENTRAS** la base de datos esté en mantenimiento, el sistema **deberá** responder 503.* |
| **Unwanted Behavior** | ***SI** [error], **ENTONCES** el sistema **deberá** [recuperación].* | ***SI** las credenciales son inválidas, **ENTONCES** el sistema **deberá** retornar 401.* |
| **Optional** | ***DONDE** [opción activa], el sistema **deberá** [acción].* | ***DONDE** 2FA esté habilitado, el sistema **deberá** exigir código OTP.* |

---

## 🛡️ Los 3 Niveles de Severidad del Árbitro

| Nivel | Nombre | Criterio de Aprobación | Exigencia de Tests | Intervención Humana |
| :--- | :--- | :--- | :--- | :--- |
| **L1** | **Pragmatic (Velocity)** | Revisión de coherencia general. Advertencias no bloqueantes. | Tests mínimos de humo. | Al inicio (Spec) y al final. |
| **L2** | **Standard (Producción)** | EARS estricto, criterios Given-When-Then, trazabilidad 1:1. | Cobertura por cada micro-tarea (≤ 30 min). | Al aprobar Plan y en arquitectura. |
| **L3** | **Draconian (Misión Crítica)** | Cero tolerancia a ambigüedad, análisis formal de amenazas OWASP. | Cobertura estricta con edge cases y rollback. | En cada compuerta de fase. |

---

## 🧪 Desarrollo y Pruebas Locales

```bash
# Clonar repositorio
git clone https://github.com/egutierrez0323/sdd-framework.git
cd sdd-framework

# Instalar dependencias
npm install

# Ejecutar suite de pruebas (Vitest)
npm test

# Compilar distribución TypeScript
npm run build

# Ejecutar auditoría interna de código limpio
npm run review
```

---

## 📄 Licencia

Distribuido bajo la Licencia **MIT**. Consulta [`LICENSE`](./LICENSE) para más información.

Creado con rigor de ingeniería por [egutierrez0323](https://github.com/egutierrez0323).
