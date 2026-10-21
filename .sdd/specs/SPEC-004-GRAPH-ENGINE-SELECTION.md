# SPEC-004: Selección Interactiva del Motor de Grafos (Graph Engine Selection & Guidance)

- **Estado:** APPROVED
- **Fecha de Creación:** 2026-10-20
- **Nivel de Severidad:** L2 (Standard)
- **Autor / Responsable:** Antigravity & Lead Engineer
- **Módulo / Dominio:** SDD CLI (Scaffold & Project Graph Engine)

---

## 1. Contexto y Justificación (El "Por Qué")
La comprensión de código asistida por IA requiere optimizar la ventana de contexto. SDD ofrece dos motores complementarios:
1. **Motor Nativo (`builtin` / `project-graph`):** Rápido (< 50ms), macroscópico (módulos, contratos exportados, tipos), con reducción de tokens del 80-95% y cero dependencias externas.
2. **Motor Forense (`graphify`):** Análisis microscópico intra-función para bases de código legadas masivas o refactorizaciones profundas de bajo nivel.

Actualmente, el asistente interactivo `sdd init` no consulta explícitamente al usuario qué motor prefiere por defecto ni proporciona una leyenda explicativa que oriente cuándo usar uno u otro. Para empoderar al desarrollador y asegurar la mejor decisión técnica desde el inicio, el asistente de inicialización debe solicitar la elección del motor con una leyenda descriptiva clara y persistir la preferencia en `.sdd/config.json`.

---

## 2. Requerimientos del Sistema (Notación EARS)

### REQ-GRAPH-01: Selección Interactiva del Motor de Grafos con Leyenda Explicativa
- **Tipo EARS:** Event-driven
- **Declaración:**
  > **CUANDO** el usuario ejecute `sdd init` de forma interactiva, el sistema **deberá** presentar un paso de selección del motor de grafos (`builtin`, `graphify`, `hybrid`) acompañado de una leyenda clara que especifique en qué casos se recomienda cada opción.
- **Criterio de Aceptación:**
  - **DADO:** La ejecución interactiva de `sdd init`.
  - **CUANDO:** Se llega al paso de configuración del motor de grafos.
  - **ENTONCES:** Se muestra la leyenda orientativa para `project-graph`, `graphify` y `hybrid`, permitiendo al usuario seleccionar su motor por defecto (con `hybrid` o `builtin` como opción recomendada).

### REQ-GRAPH-02: Soporte para Modo No-Interactivo y Flags de CLI
- **Tipo EARS:** State-driven
- **Declaración:**
  > **MIENTRAS** `sdd init` se ejecute con argumentos de línea de comandos (`--graph-engine <builtin|graphify|hybrid>`), el sistema **deberá** parsear dicho parámetro y omitir la consulta interactiva, aplicando el valor por defecto si no se especifica.
- **Criterio de Aceptación:**
  - **DADO:** La ejecución de `sdd init --graph-engine graphify --yes`.
  - **CUANDO:** El comando procesa las opciones.
  - **ENTONCES:** Se establece el motor `graphify` en la configuración sin solicitar entrada en consola.

### REQ-GRAPH-03: Persistencia en la Configuración del Proyecto
- **Tipo EARS:** Ubicuo
- **Declaración:**
  > El sistema **deberá** persistir el motor de grafos seleccionado en el archivo `.sdd/config.json` bajo la propiedad `graph.engine`.
- **Criterio de Aceptación:**
  - **DADO:** Un proyecto inicializado con la opción de motor elegida.
  - **CUANDO:** Se genera o actualiza `.sdd/config.json`.
  - **ENTONCES:** `config.graph.engine` contiene exactamente el valor seleccionado (`builtin`, `graphify` o `hybrid`).

### REQ-GRAPH-04: Arsenal de Skills con Soporte Graphify
- **Tipo EARS:** Ubicuo
- **Declaración:**
  > El sistema **deberá** incluir la skill `graphify` en el arsenal oficial de `.agents/skills/` y en `BUILTIN_SKILLS` de andamiaje, proporcionando directrices para el uso forense de llamadas y la integración con el visualizador SDD.
- **Criterio de Aceptación:**
  - **DADO:** La inicialización de un proyecto con `includeSkills: true`.
  - **CUANDO:** Se generan las skills en `.agents/skills/`.
  - **ENTONCES:** Se crea `.agents/skills/graphify/SKILL.md` con las instrucciones de uso forense y vinculación con SDD.

---

## 3. Límites y Restricciones
- El soporte no debe requerir que Graphify esté preinstalado en el sistema del usuario al momento de ejecutar `sdd init`.
- La leyenda debe estar disponible tanto en español como en inglés, alineada con el idioma seleccionado en el paso 1.
