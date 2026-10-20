# SPEC-003: Soporte Multi-Lenguaje e Internacionalización (i18n)

- **Estado:** APPROVED
- **Fecha de Creación:** 2026-10-20
- **Nivel de Severidad:** L2 (Standard)
- **Autor / Responsable:** Antigravity & Lead Engineer
- **Módulo / Dominio:** SDD Internationalization (UI Visualizer, CLI & Templates)

---

## 1. Contexto y Justificación (El "Por Qué")
El framework SDD está diseñado para distribuirse globalmente como herramienta estándar de ingeniería vía npm (`npx sdd-framework`). Actualmente, la interfaz web del visualizador (`sdd ui`) y los mensajes del sistema están principalmente en español, lo que limita su adopción por equipos globales donde el inglés es el idioma estándar de facto.

Para asegurar máxima accesibilidad y profesionalismo sin perder la cercanía con desarrolladores hispanohablantes, se implementará un sistema de internacionalización (i18n) ligero, reactivo y con cero dependencias externas.

---

## 2. Requerimientos del Sistema (Notación EARS)

### REQ-003-01: Selector de Idioma Reactivo en el Visualizador Web
- **Tipo EARS:** Ubicuo
- **Declaración:**
  > El sistema **deberá** proveer un selector de idioma interactivo en el encabezado del visualizador web (`[ EN | ES ]`) que traduzca instantáneamente toda la interfaz entre inglés y español sin recargar la página, persistiendo la preferencia del usuario en `localStorage`.
- **Criterio de Aceptación:**
  - **DADO:** El usuario navegando en el visualizador web (`sdd ui`).
  - **CUANDO:** El usuario hace clic en el selector `EN` o `ES`.
  - **ENTONCES:** Todos los textos de navegación, tarjetas de estadísticas, botones de acción y títulos se actualizan reactivamente al idioma seleccionado y la preferencia se guarda para visitas futuras.

### REQ-003-02: Mapeo Bilingüe de Criterios de Aceptación EARS
- **Tipo EARS:** Event-driven
- **Declaración:**
  > **CUANDO** se renderice un requerimiento con criterios de aceptación Given-When-Then / Dado-Cuando-Entonces, el visualizador **deberá** formatear las etiquetas según el idioma activo (`GIVEN / WHEN / THEN` en modo inglés, `DADO / CUANDO / ENTONCES` en modo español).
- **Criterio de Aceptación:**
  - **DADO:** Una especificación con criterios de aceptación.
  - **CUANDO:** El visualizador está en modo `EN`.
  - **ENTONCES:** Las etiquetas del bloque de criterios muestran `GIVEN:`, `WHEN:`, `THEN:`.
  - **CUANDO:** El visualizador está en modo `ES`.
  - **ENTONCES:** Las etiquetas del bloque de criterios muestran `DADO:`, `CUANDO:`, `ENTONCES:`.

### REQ-003-03: Configuración de Idioma por Defecto en `sdd.config.json`
- **Tipo EARS:** Opcional
- **Declaración:**
  > **DONDE** el archivo `sdd.config.json` defina el campo `locale` (`"locale": "en" | "es"`), el sistema **deberá** usar dicho valor como idioma predeterminado del proyecto (utilizando `"en"` como valor predeterminado si no se especifica).
- **Criterio de Aceptación:**
  - **DADO:** Una configuración de proyecto con `"locale": "en"`.
  - **CUANDO:** Se cargan los datos en el visualizador sin preferencia previa en `localStorage`.
  - **ENTONCES:** La interfaz se inicializa automáticamente en inglés.

### REQ-003-04: Plantillas de Andamiaje Bilingües (Scaffold Templates)
- **Tipo EARS:** Event-driven
- **Declaración:**
  > **CUANDO** el usuario inicialice un proyecto con `sdd init`, el sistema **deberá** ofrecer la selección de idioma (`English` o `Español`) y generar las plantillas (`spec`, `plan`, `tasks`, `ears-guide`, `AGENTS.md`) en el idioma seleccionado.
- **Criterio de Aceptación:**
  - **DADO:** Ejecución interactiva de `sdd init`.
  - **CUANDO:** Se selecciona inglés (`en`).
  - **ENTONCES:** Los archivos en `.sdd/templates/` y `AGENTS.md` se generan en inglés con terminología técnica estándar.

---

## 3. Límites y Restricciones
- **Cero Dependencias Externas:** La internacionalización en el cliente web y en el CLI debe implementarse con diccionarios tipados ligeros en TypeScript, sin librerías pesadas como `i18next` o equivalentes.
- **Compatibilidad Total:** El cambio de idioma no debe afectar la estructura de datos que viaja en la API JSON (`/api/data`).
- **Persistencia Local:** La preferencia del usuario en el navegador tiene precedencia sobre el valor por defecto del archivo de configuración.

---

## 4. Registro de Decisiones de Arquitectura
| Pregunta / Decisión | Resolución | Justificación |
| :--- | :--- | :--- |
| **¿Cómo manejar specs redactadas en español si el usuario cambia a inglés?** | Los metadatos y etiquetas de la UI se traducen al 100%. El contenido del usuario (títulos y declaraciones) se conserva intacto, adaptando únicamente las etiquetas contextuales (GIVEN/WHEN/THEN, EARS types, estados). | Respeta la autoría del texto original del desarrollador. |
| **Idioma por defecto del framework** | Inglés (`en`) por defecto para distribución global en `npx`, con soporte nativo de primera clase para español (`es`). | Máxima tracción en el ecosistema open source internacional. |
