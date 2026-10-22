# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

Planned as **2.0.0**: the changes below alter the default behavior of `init`, `sync` and `reverse`.
Specification: [SPEC-005](.sdd/specs/SPEC-005-SAFE-BRIDGES.md) · Plan: [PLAN-005](.sdd/plans/PLAN-005-SAFE-BRIDGES.md).

### Changed (breaking)

- **Agent bridges are no longer overwritten.** `init`, `sync` and `reverse` only add or update a block delimited by `<!-- SDD:BEGIN -->` and `<!-- SDD:END -->` in `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md` and `.agents/rules/sdd-rules.md`. Text outside the block is preserved byte for byte. Previously these files were replaced with a copy of `AGENTS.md` on every run.
- **The SDD constitution lives in `.sdd/constitution.md`.** It is the single source of the bridges. `AGENTS.md` is now a bridge like the others. `CLAUDE.md` imports the constitution with `@.sdd/constitution.md`; the other bridges contain its full text.
- `sdd sync` requires `.sdd/constitution.md` (or a 1.x constitution in `AGENTS.md` to migrate). Without it, it aborts without writing and exits with code 1.
- `sdd init` keeps an existing `.sdd/config.json` (merged with the new defaults) and existing templates. Only options passed explicitly on the command line replace existing values; previously `init` reset the configuration and always imposed `--severity L2`.
- `sdd reverse` creates the constitution in `.sdd/constitution.md` instead of `AGENTS.md`, and updates only the bridges listed in `config.bridges` instead of all four.
- `sdd ui` reads the constitution from `.sdd/constitution.md`, and falls back to `AGENTS.md` only in projects that have not been migrated.
- Public API:
  - `syncBridges` keeps its signature but writes only the managed block;
  - `SyncReport` adds `failed`, `backups` and `warnings`;
  - `ScaffoldOptions.severity` and `ScaffoldOptions.bridges` are now optional;
  - `ScaffoldResult` adds `modifiedFiles`, `backups` and `failed`;
  - `SddDashboardData` adds `constitutionPath`.

### Added

- `--dry-run` for `init`, `sync` and `reverse`: shows the files that would be created or modified, with a unified diff of each modification, without writing anything.
- `--yes` for `init`, `sync` and `reverse`. In an interactive terminal, existing files are listed and confirmation is requested before they are modified.
- Backups in `.sdd/backups/<YYYYMMDD-HHMMSS>/` before the block is inserted in an existing file for the first time.
- Automatic migration of 1.x projects:
  - bridges that are exact copies of `AGENTS.md` are reduced to the block;
  - edited copies are kept, with a warning;
  - a 1.x constitution in `AGENTS.md` is moved to `.sdd/constitution.md`.
- New modules exported from the package entry point: `text-file`, `managed-block`, `line-diff`, `prompt`, `file-plan` and `bridge-migration`.
- New functions: `planScaffold`, `planReverse`, `planBridgeSync` and `mergeConfig`.
- `--lang` documented in `sdd help` (it already existed).

### Fixed

- The original BOM and line endings (CRLF or LF) of modified files are preserved. Previously the banner was written before the BOM.
- Files that are not valid UTF-8, or that have broken block markers, are left untouched and reported with their line, instead of aborting the whole run.
- `.sdd/config.json` saved with a BOM (common with Windows editors) was silently ignored. An invalid `config.json` is no longer overwritten by `init`.
- The test suite no longer writes into the repository: `tests/bridges.test.ts` rewrote this project's `CLAUDE.md`, and `tests/project-graph.test.ts` rewrote `.sdd/architecture-graph.md`.

### Known issues

- `sdd run` still runs `git add -A` and `git commit` after each passing task, and `git reset --hard HEAD` plus `git clean -fd` after three failures. Do not use it in a repository with uncommitted work. Fix in progress: [SPEC-006](.sdd/specs/SPEC-006-SAFE-RUN.md).

## [1.0.0] - 2026-10-20

- Initial release.
