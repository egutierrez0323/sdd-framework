---
name: project-graph
description: Generación y consulta de grafos de arquitectura y dependencias para optimizar contexto y reducir el consumo de tokens en agentes de IA.
---

# Project-Graph Skill: Navegación de Código Basada en Grafos y Ahorro de Tokens

> **PROPÓSITO:** En lugar de saturar la ventana de contexto de la IA cargando decenas de archivos de código completos (lo que cuesta miles de tokens y diluye la atención del modelo), este skill permite a los agentes consultar un **Grafo Semántico Ultracompacto** de la arquitectura.

---

## 1. El Principio de "Contexto Mínimo Necesario"

1. **Consulta el Grafo Primero:** Antes de leer un archivo completo, consulta `.sdd/context-graph.json` o `.sdd/architecture-graph.md`.
2. **Navegación Dirigida:**
   - Si necesitas saber qué módulo gestiona la configuración, busca en el índice de símbolos:
     - `src/core/config.ts` exporta `[loadConfig, saveConfig, SeverityLevel]`.
   - Si necesitas saber el impacto de cambiar un archivo, sigue las aristas de dependencias (`edges`).
3. **Reducción de Costes:** El grafo reduce en un **80% a 95%** los tokens necesarios para comprender la estructura global del repositorio.

---

## 2. Comandos Disponibles

- **Generar / Actualizar el Grafo:**
  ```bash
  node dist/cli.js graph
  ```
  Genera:
  - `.sdd/architecture-graph.md`: Diagrama Mermaid visual + tabla resumen de símbolos.
  - `.sdd/context-graph.json`: Estructura JSON indexada para consumo directo por agentes.

---

## 3. Guía de Uso para el Agente

Cuando el usuario pida: *"¿Cómo está organizado el proyecto?"* o *"¿Qué dependencias tiene el módulo X?"*:
1. Lee `.sdd/architecture-graph.md`.
2. Responde basándote en los nodos y aristas del grafo.
3. Solo abre los archivos específicos que requieran edición activa.
