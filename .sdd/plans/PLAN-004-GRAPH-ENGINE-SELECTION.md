# PLAN-004: Plan Técnico para Selección de Motor de Grafos y Leyenda

- **Estado:** APPROVED
- **Especificación Asociada:** [SPEC-004](../specs/SPEC-004-GRAPH-ENGINE-SELECTION.md)
- **Nivel de Severidad:** L2
- **Fecha:** 2026-10-20

---

## 1. Visión General de la Arquitectura
Se modificará el asistente de inicialización interactivo en `src/cli.ts` para incorporar la pregunta sobre el motor de grafos con su respectiva leyenda explicativa bilingüe. Se actualizará la función `scaffoldProject` en `src/core/scaffold.ts` para recibir `graphEngine`, persistirlo en `config.json` y agregar la skill `graphify` en `BUILTIN_SKILLS`.

---

## 2. Contratos e Interfaces
```typescript
export interface ScaffoldOptions {
  projectRoot: string;
  projectName?: string;
  mode: 'greenfield' | 'brownfield';
  severity: SeverityLevel;
  bridges: SupportedBridge[];
  includeSkills: boolean;
  locale?: 'en' | 'es';
  graphEngine?: 'builtin' | 'graphify' | 'hybrid';
}
```

---

## 3. Estrategia de Testing
- Pruebas unitarias en `tests/scaffold.test.ts` verificando que `scaffoldProject` persista `graph.engine` con valores `builtin`, `graphify` o `hybrid`, y que la skill `graphify` se genere correctamente en `.agents/skills/graphify/SKILL.md`.
