# Mapa Visual de Arquitectura y Grafo de Dependencias

> **MÉTRICAS DE TOKENS:**
> - Archivos analizados: **45**
> - Símbolos exportados: **71**
> - Tokens código fuente completo: ~**38136** tokens
> - Tokens del grafo compacto: ~**1428** tokens
> - **Ahorro de Tokens: 96%**

```mermaid
graph TD
  card_validator_src_api_handlers_ts["handlers.ts<br/>(handleHealth)"]
  card_validator_src_api_http_utils_ts["http-utils.ts<br/>(DEFAULT_MAX_BODY_BYTES, ApiErrorResponse, sendJson...)"]
  card_validator_src_api_router_ts["router.ts<br/>()"]
  card_validator_src_bin_server_ts["server.ts<br/>()"]
  card_validator_src_brands_ts["brands.ts<br/>(detectCardBrand)"]
  card_validator_src_cvv_ts["cvv.ts<br/>(validateCvv)"]
  card_validator_src_expiration_ts["expiration.ts<br/>(validateExpiration)"]
  card_validator_src_index_ts["index.ts<br/>()"]
  card_validator_src_luhn_ts["luhn.ts<br/>(validateLuhn)"]
  card_validator_src_sanitizer_ts["sanitizer.ts<br/>(sanitizeCardNumber)"]
  card_validator_src_server_ts["server.ts<br/>(createCardServer)"]
  card_validator_src_types_ts["types.ts<br/>(CardBrand, CardInput, CardValidationResult)"]
  card_validator_src_validator_ts["validator.ts<br/>(validateCreditCard)"]
  card_validator_tests_api_test_ts["api.test.ts<br/>()"]
  card_validator_tests_brands_test_ts["brands.test.ts<br/>()"]
  card_validator_tests_cvv_test_ts["cvv.test.ts<br/>()"]
  card_validator_tests_expiration_test_ts["expiration.test.ts<br/>()"]
  card_validator_tests_http_utils_test_ts["http-utils.test.ts<br/>()"]
  card_validator_tests_luhn_test_ts["luhn.test.ts<br/>()"]
  card_validator_tests_sanitizer_test_ts["sanitizer.test.ts<br/>()"]
  card_validator_tests_validator_test_ts["validator.test.ts<br/>()"]
  src_cli_ts["cli.ts<br/>()"]
  src_core_auto_runner_ts["auto-runner.ts<br/>(TaskStatus, MicroTask, AutoRunResult...)"]
  src_core_bridges_ts["bridges.ts<br/>(SupportedBridge, SyncReport)"]
  src_core_clarifier_ts["clarifier.ts<br/>(ClarificationQuestion, InvariantViolation, AutoGrillSession...)"]
  src_core_code_reviewer_ts["code-reviewer.ts<br/>(DuplicateBlock, FunctionMetric, ReviewFinding...)"]
  src_core_config_ts["config.ts<br/>(SeverityLevel, SddConfig, DEFAULT_CONFIG)"]
  src_core_ears_validator_ts["ears-validator.ts<br/>(EarsType, EarsRequirement, ValidationIssue...)"]
  src_core_project_graph_ts["project-graph.ts<br/>(GraphNode, ProjectGraph, formatMermaidGraph)"]
  src_core_reverse_engine_ts["reverse-engine.ts<br/>(ProjectScanResult, generateReverseConstitution, generateReverseBaselineSpec)"]
  src_core_scaffold_ts["scaffold.ts<br/>(ScaffoldOptions, ScaffoldResult, BUILTIN_TEMPLATES...)"]
  src_index_ts["index.ts<br/>()"]
  src_utils_fs_helpers_ts["fs-helpers.ts<br/>()"]
  src_utils_git_client_ts["git-client.ts<br/>(GitStatus, GitClient)"]
  src_utils_logger_ts["logger.ts<br/>(ArbiterRole, Logger)"]
  tests_auto_runner_test_ts["auto-runner.test.ts<br/>()"]
  tests_bridges_test_ts["bridges.test.ts<br/>()"]
  tests_clarifier_test_ts["clarifier.test.ts<br/>()"]
  tests_code_reviewer_test_ts["code-reviewer.test.ts<br/>(doAlpha, doBeta, funcA...)"]
  tests_config_test_ts["config.test.ts<br/>()"]
  tests_ears_validator_test_ts["ears-validator.test.ts<br/>()"]
  tests_project_graph_test_ts["project-graph.test.ts<br/>()"]
  tests_reverse_engine_test_ts["reverse-engine.test.ts<br/>()"]
  tests_scaffold_test_ts["scaffold.test.ts<br/>()"]
  vitest_config_ts["vitest.config.ts<br/>()"]
```

## Índice Semántico Ultracompacto de Contexto

| Módulo | Símbolos Exportados | Dependencias Clave |
| :--- | :--- | :--- |
| `card-validator/src/api/handlers.ts` | `handleHealth` | `http-utils.js`, `validator.js`, `luhn.js`, `sanitizer.js`, `brands.js`, `types.js` |
| `card-validator/src/api/http-utils.ts` | `DEFAULT_MAX_BODY_BYTES`, `ApiErrorResponse`, `sendJson`, `createErrorResponse` | *(ninguna)* |
| `card-validator/src/api/router.ts` | *(interno)* | `handlers.js`, `http-utils.js` |
| `card-validator/src/bin/server.ts` | *(interno)* | `server.js` |
| `card-validator/src/brands.ts` | `detectCardBrand` | `types.js` |
| `card-validator/src/cvv.ts` | `validateCvv` | `types.js` |
| `card-validator/src/expiration.ts` | `validateExpiration` | *(ninguna)* |
| `card-validator/src/index.ts` | *(interno)* | *(ninguna)* |
| `card-validator/src/luhn.ts` | `validateLuhn` | *(ninguna)* |
| `card-validator/src/sanitizer.ts` | `sanitizeCardNumber` | *(ninguna)* |
| `card-validator/src/server.ts` | `createCardServer` | `router.js` |
| `card-validator/src/types.ts` | `CardBrand`, `CardInput`, `CardValidationResult` | *(ninguna)* |
| `card-validator/src/validator.ts` | `validateCreditCard` | `types.js`, `sanitizer.js`, `luhn.js`, `brands.js`, `expiration.js`, `cvv.js` |
| `card-validator/tests/api.test.ts` | *(interno)* | `server.js` |
| `card-validator/tests/brands.test.ts` | *(interno)* | `brands.js` |
| `card-validator/tests/cvv.test.ts` | *(interno)* | `cvv.js` |
| `card-validator/tests/expiration.test.ts` | *(interno)* | `expiration.js` |
| `card-validator/tests/http-utils.test.ts` | *(interno)* | `http-utils.js` |
| `card-validator/tests/luhn.test.ts` | *(interno)* | `luhn.js` |
| `card-validator/tests/sanitizer.test.ts` | *(interno)* | `sanitizer.js` |
| `card-validator/tests/validator.test.ts` | *(interno)* | `validator.js` |
| `src/cli.ts` | *(interno)* | `config.js`, `ears-validator.js`, `reverse-engine.js`, `bridges.js`, `auto-runner.js`, `project-graph.js`, `code-reviewer.js`, `scaffold.js`, `fs-helpers.js`, `logger.js` |
| `src/core/auto-runner.ts` | `TaskStatus`, `MicroTask`, `AutoRunResult`, `parseTasksMarkdown`, `updateTaskStatusInMarkdown`, `RunnerOptions` | `git-client.js`, `logger.js` |
| `src/core/bridges.ts` | `SupportedBridge`, `SyncReport` | `fs-helpers.js` |
| `src/core/clarifier.ts` | `ClarificationQuestion`, `InvariantViolation`, `AutoGrillSession`, `CodebaseContext`, `generateClarificationSession`, `runAutoGrillSession`, `auditArchitectDecision`, `formatClarificationMarkdown`, `injectDecisionsIntoSpec` | `ears-validator.js`, `config.js` |
| `src/core/code-reviewer.ts` | `DuplicateBlock`, `FunctionMetric`, `ReviewFinding`, `ProjectReviewReport`, `ReviewOptions`, `findDuplicateBlocks`, `analyzeFunctionMetrics`, `formatReviewReport` | `fs-helpers.js` |
| `src/core/config.ts` | `SeverityLevel`, `SddConfig`, `DEFAULT_CONFIG` | *(ninguna)* |
| `src/core/ears-validator.ts` | `EarsType`, `EarsRequirement`, `ValidationIssue`, `ValidationReport`, `parseSpecMarkdown`, `validateSpec` | `config.js` |
| `src/core/project-graph.ts` | `GraphNode`, `ProjectGraph`, `formatMermaidGraph` | `fs-helpers.js` |
| `src/core/reverse-engine.ts` | `ProjectScanResult`, `generateReverseConstitution`, `generateReverseBaselineSpec` | `fs-helpers.js` |
| `src/core/scaffold.ts` | `ScaffoldOptions`, `ScaffoldResult`, `BUILTIN_TEMPLATES`, `EjemploContrato`, `BUILTIN_SKILLS`, `generateStandardConstitution` | `config.js`, `bridges.js`, `reverse-engine.js`, `fs-helpers.js` |
| `src/index.ts` | *(interno)* | *(ninguna)* |
| `src/utils/fs-helpers.ts` | *(interno)* | *(ninguna)* |
| `src/utils/git-client.ts` | `GitStatus`, `GitClient` | *(ninguna)* |
| `src/utils/logger.ts` | `ArbiterRole`, `Logger` | *(ninguna)* |
| `tests/auto-runner.test.ts` | *(interno)* | *(ninguna)* |
| `tests/bridges.test.ts` | *(interno)* | `bridges.js`, `fs-helpers.js` |
| `tests/clarifier.test.ts` | *(interno)* | *(ninguna)* |
| `tests/code-reviewer.test.ts` | `doAlpha`, `doBeta`, `funcA`, `funcB`, `shortFunc`, `longMonolithicFunc` | *(ninguna)* |
| `tests/config.test.ts` | *(interno)* | `config.js` |
| `tests/ears-validator.test.ts` | *(interno)* | `ears-validator.js` |
| `tests/project-graph.test.ts` | *(interno)* | `project-graph.js`, `fs-helpers.js` |
| `tests/reverse-engine.test.ts` | *(interno)* | `reverse-engine.js` |
| `tests/scaffold.test.ts` | *(interno)* | `scaffold.js`, `fs-helpers.js` |
| `vitest.config.ts` | *(interno)* | *(ninguna)* |
