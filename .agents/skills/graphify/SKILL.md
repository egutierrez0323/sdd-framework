---
name: graphify
description: Extracción y análisis de grafos forenses de llamadas de bajo nivel intra-función para auditorías profundas y código legado.
---

# Graphify Skill: Mapeo Forense y Rastreo de Llamadas Intra-Función

> **PROPÓSITO:** Proporcionar al agente de IA capacidades de inspección de código a nivel microscópico, rastreando llamadas entre funciones internas, métodos privados y dependencias profundas antes de realizar refactorizaciones críticas o depuración en proyectos masivos.

---

## 1. ¿Cuándo Utilizar Graphify vs Project-Graph?

- **Usa Project-Graph (Nativo de SDD) cuando:**
  - Estás planificando nuevas funcionalidades o redactando especificaciones EARS.
  - Necesitas entender contratos públicos, interfaces exportadas y dependencias entre módulos.
  - Deseas mantener el consumo de tokens en mínimos (~300 a 600 tokens).

- **Usa Graphify cuando:**
  - Estás trabajando en una base de código legado sin documentación ni tipado estricto.
  - Necesitas saber exactamente qué funciones internas llaman a un método privado antes de modificarlo o eliminarlo.
  - Requieres un mapa forense exhaustivo de llamadas de bajo nivel (árbol de ejecución).

---

## 2. Integración con el Ecosistema SDD

SDD integra automáticamente los resultados de Graphify:
1. Si ejecutas Graphify o existe un archivo `graph.html`, `graph.json` o `.graphify/graph.json` en el repositorio, el comando `sdd graph` lo detecta de inmediato.
2. SDD enlaza el grafo forense dentro de `.sdd/architecture-graph.md` bajo la sección:
   `> 🔍 GRAFO FORENSE PROFUNDO DETECTADO (Graphify)`
3. Los agentes pueden consultar tanto la visión macroscópica de SDD como el mapa detallado de Graphify.

---

## 3. Protocolo para el Agente

Cuando se requiera trazabilidad forense de funciones:
1. Revisa si existe `.graphify/graph.json` o `graph.json`.
2. Identifica la cadena de llamadas del símbolo a modificar para prevenir efectos secundarios no deseados.
3. Si el grafo no está generado y el usuario solicitó Graphify como motor, sugiere o ejecuta la generación del grafo forense según las herramientas disponibles en el entorno.
