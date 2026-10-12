# SPEC-002: Auto-Cuestionamiento, Revisión de Código Limpio y Detección DRY

- **Estado:** APPROVED
- **Fecha de Creación:** 2026-10-12
- **Nivel de Severidad:** L2 (Standard)
- **Autor / Responsable:** Antigravity & Usuario
- **Módulo / Dominio:** SDD Quality Gates & Clean Code Reviewer

---

## 1. Contexto y Justificación (El "Por Qué")
En los flujos de trabajo asistidos por IA, los modelos de lenguaje tienden a optimizar la solución más rápida para hacer pasar un prompt o un test, incurriendo en malas prácticas como: duplicación de código ("copy-paste" entre funciones o archivos), funciones monolíticas de alta complejidad, nombres crípticos y falta de abstracción (violación de DRY y SOLID). 

Para combatir esto, el framework SDD debe incorporar:
1. Una capacidad nativa de auditoría y revisión de código limpio (`sdd review`) que analice deterministamente la duplicación, tamaño de funciones y métricas de legibilidad.
2. Una habilidad (Skill) de auto-cuestionamiento (`clean-code`) que obligue al agente a ejecutar una fase de refactorización segura ("Red -> Green -> Refactor") antes de cada commit.
3. Actualización de la Constitución (`AGENTS.md`) para formalizar la regla innegociable de higiene de código.

---

## 2. Requerimientos del Sistema (Notación EARS)

### REQ-002-01: Habilidad de Auto-Cuestionamiento y Refactorización (Skill Clean-Code)
- **Tipo EARS:** Ubiquitous
- **Declaración:**
  > El sistema **deberá** proveer una habilidad (`.agents/skills/clean-code/SKILL.md`) que instruya al agente a ejecutar un pase reflexivo de Clean Code y DRY inmediatamente después de que los tests de una tarea pasen y antes de realizar el commit.
- **Criterio de Aceptación:**
  - **DADO:** Un agente ejecutando micro-tareas de desarrollo.
  - **CUANDO:** El agente consulta las habilidades disponibles.
  - **ENTONCES:** Existe `clean-code` con la rúbrica de 6 preguntas de auto-cuestionamiento, principios SOLID, reglas DRY y el protocolo de refactorización segura con rollback si un test se quiebra.

### REQ-002-02: Módulo Core de Análisis de Código Limpio y Duplicación DRY
- **Tipo EARS:** Event-driven
- **Declaración:**
  > **CUANDO** se invoque la función de auditoría de código (`reviewProject` o `reviewFile`), el sistema **deberá** escanear el código fuente para calcular métricas de duplicación de bloques de líneas (DRY), funciones excesivamente largas (> 35 líneas), exceso de parámetros (> 4 parámetros) y generar una lista de hallazgos con severidad y recomendaciones accionables.
- **Criterio de Aceptación:**
  - **DADO:** Uno o varios archivos de código fuente TypeScript/JavaScript.
  - **CUANDO:** Se ejecuta el análisis de código con el motor de revisión.
  - **ENTONCES:** Retorna un objeto estructurado con puntuación de calidad (0-100), resumen de duplicación detectada (bloques repetidos), lista de funciones de riesgo y advertencias específicas.

### REQ-002-03: Comando CLI `sdd review`
- **Tipo EARS:** Event-driven
- **Declaración:**
  > **CUANDO** el usuario ejecute `sdd review [ruta]` en el CLI, el sistema **deberá** ejecutar el análisis de código sobre la ruta especificada (o por defecto `src/`), renderizar un reporte visual en consola con la puntuación de calidad y listar las refactorizaciones sugeridas.
- **Criterio de Aceptación:**
  - **DADO:** Un proyecto con código fuente en `src/`.
  - **CUANDO:** Se ejecuta `node dist/cli.js review`.
  - **ENTONCES:** La consola muestra el banner de revisión, la puntuación de salud de código, la lista de problemas detectados (si existen) y consejos de refactorización limpia.

### REQ-002-04: Formalización en la Constitución del Proyecto
- **Tipo EARS:** State-driven
- **Declaración:**
  > **MIENTRAS** el agente de IA opere en el repositorio, el sistema **deberá** exigir en `AGENTS.md` el cumplimiento del ciclo "Red -> Green -> Refactor" y la prohibición de duplicación de código innecesaria antes de cada commit.
- **Criterio de Aceptación:**
  - **DADO:** El archivo de constitución `AGENTS.md`.
  - **CUANDO:** Es leído por cualquier IA o herramienta de sincronización.
  - **ENTONCES:** Incluye la sección obligatoria de verificación Clean Code & DRY previa a todo commit.

---

## 3. Contratos de Datos e Interfaces

```typescript
export interface DuplicateBlock {
  sourceFile: string;
  targetFile: string;
  startLineSource: number;
  startLineTarget: number;
  lineCount: number;
  snippet: string;
}

export interface FunctionMetric {
  file: string;
  name: string;
  lineCount: number;
  paramCount: number;
  lineStart: number;
  isOverLimit: boolean;
}

export interface ReviewFinding {
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  category: 'DRY' | 'COMPLEXITY' | 'CLEAN_CODE';
  file: string;
  line?: number;
  message: string;
  suggestion: string;
}

export interface ProjectReviewReport {
  timestamp: string;
  filesScanned: number;
  totalLines: number;
  qualityScore: number; // 0 a 100
  duplicates: DuplicateBlock[];
  longFunctions: FunctionMetric[];
  findings: ReviewFinding[];
  summary: {
    cleanCodeStatus: 'EXCELLENT' | 'GOOD' | 'NEEDS_REFACTOR' | 'CRITICAL';
    dryViolationsCount: number;
    highComplexityCount: number;
  };
}
```
