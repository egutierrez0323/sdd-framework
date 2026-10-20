# TASKS-003: Micro-Tareas de Implementación para SPEC-003 (i18n & Multi-Language)

- **Especificación Asociada:** [SPEC-003-I18N-SUPPORT.md](../specs/SPEC-003-I18N-SUPPORT.md)
- **Modo de Ejecución:** Autónomo Verificable
- **Comando de Verificación General:** `npm test`

---

## Reglas de Ejecución:
1. Tomar una micro-tarea a la vez en orden secuencial.
2. Cada tarea debe completarse en ≤ 30 minutos de tiempo estimado.
3. Ejecutar el comando de verificación antes de marcar la casilla como completada (`[x]`).
4. Si la verificación pasa: commit semántico (`feat(REQ-003-X): descripción`).

---

## Lista de Micro-Tareas

- [x] **TASK-003-01**: Extender `SddConfig` con soporte para `locale` ('en' | 'es')
  - **Requisito Asociado:** REQ-003-03
  - **Archivos:** `src/core/config.ts`, `tests/config.test.ts`
  - **Criterio de Finalización:** `DEFAULT_CONFIG` incluye `locale: 'en'`, y `loadConfig` lee correctamente el locale.
  - **Verificación:** `npm test tests/config.test.ts`

- [x] **TASK-003-02**: Implementar diccionario i18n y conmutador reactivo `[ EN | ES ]` en el Dashboard Web
  - **Requisito Asociado:** REQ-003-01
  - **Archivos:** `src/core/ui-html.ts`
  - **Criterio de Finalización:** El encabezado del dashboard incluye los botones `EN` y `ES`, alternando dinámicamente todos los textos de navegación, tarjetas de métricas y botones.
  - **Verificación:** `npm test tests/ui-server.test.ts`

- [x] **TASK-003-03**: Mapeo dinámico de Criterios de Aceptación (GIVEN/WHEN/THEN <-> DADO/CUANDO/ENTONCES)
  - **Requisito Asociado:** REQ-003-02
  - **Archivos:** `src/core/ui-html.ts`
  - **Criterio de Finalización:** Las cajas de criterios se adaptan al idioma seleccionado en tiempo real.
  - **Verificación:** `npm run build`

- [x] **TASK-003-04**: Sincronización del Locale en API del Servidor UI
  - **Requisito Asociado:** REQ-003-03
  - **Archivos:** `src/core/ui-server.ts`, `tests/ui-server.test.ts`
  - **Criterio de Finalización:** `/api/data` expone `locale` del proyecto para inicialización automática.
  - **Verificación:** `npm test tests/ui-server.test.ts`

- [x] **TASK-003-05**: Verificación integral de calidad y suite completa
  - **Requisito Asociado:** REQ-003-01, REQ-003-02, REQ-003-03
  - **Archivos:** Todos los modificados
  - **Criterio de Finalización:** 100% tests en verde y score de Clean Code ≥ 85.
  - **Verificación:** `npm run build; npm test; npm run review`
