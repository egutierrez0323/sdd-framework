# SDD Framework

[![CI Quality Gate](https://github.com/egutierrez0323/sdd-framework/actions/workflows/ci.yml/badge.svg)](https://github.com/egutierrez0323/sdd-framework/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20ESM-blue.svg)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest%20100%25-green.svg)](https://vitest.dev/)

> **Spec-Driven Development CLI and verification harness for agentic software engineering.**

SDD enforces deterministic contracts between requirements, human architectural decisions, and autonomous AI code generation (Cursor, Claude Code, GitHub Copilot, Antigravity, and autonomous loops). It replaces unconstrained, heuristic code generation with formal specifications written in **EARS (Easy Approach to Requirements Syntax)**, automated boundary verification, and atomic test-backed micro-tasks.

---

## Overview

Unconstrained AI code generation introduces systemic risks in production environments: architectural drift, hallucinated dependencies, silent regressions in public contracts, and sycophantic acceptance of flawed technical decisions.

SDD eliminates these failure modes through a structured specification-to-code lifecycle:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  1. SPECIFY     │ ───> │  2. VALIDATE    │ ───> │  3. PLAN        │ ───> │  4. EXECUTE     │
│  EARS Notation  │      │  Socratic Grill │      │  Typed Schemas  │      │  Atomic Tasks   │
│  (.sdd/specs/)  │      │  Anti-Sycophancy│      │  (.sdd/plans/)  │      │  (Verify Loop)  │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
```

1. **Agnostic & Zero-Friction:** Works with any language stack (Node.js, TypeScript, Python, Go, Rust) and any LLM provider via standard Markdown (`.sdd/`) and JSON indices.
2. **Dual Operation Mode:**
   - **Greenfield:** Bootstrap new codebases with architectural rules, EARS templates, and agent bridge configurations.
   - **Brownfield (Reverse-SDD):** Passively scan existing codebases to derive a baseline contract (`SPEC-000-BASELINE.md`) and tailor agent constraints to current stack patterns.
3. **Anti-Sycophancy Guard (Devil's Advocate):** Prevents AI agents from complacently accepting instructions that break baseline contracts, degrade security posture, or bypass tests.
4. **Built-in Web Visualizer (`sdd ui`):** Inspect specifications, task progress, and dependency graphs locally, with dedicated `@media print` styling for technical documentation and audit exports.

---

## Quick Start

Execute directly via `npx` without prior global installation:

```bash
# Initialize SDD in any repository (Greenfield or Brownfield)
npx sdd-framework init
```

The interactive wizard configures:
- Project mode (Greenfield vs. Brownfield with reverse scan).
- Auditor severity level (`L1`, `L2`, or `L3`).
- Graph engine (`builtin` / `project-graph`, `graphify`, or `hybrid`) with contextual guidance.
- Agent bridges (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, …): SDD only adds or updates a delimited block in them (see below).
- Core templates and skill definitions (`grill-me`, `clean-code`, `project-graph`, `graphify`, `sdd-methodology`).

---

## Using SDD in Existing Projects (Uso en proyectos existentes)

SDD never replaces your own agent instructions. Preview every change before anything is written:

```bash
sdd init --dry-run   # lists the files it would create or modify, with a unified diff of each modification
```

### Files that `init` creates (only when they do not exist yet)

| Path | Content |
| :--- | :--- |
| `.sdd/constitution.md` | The SDD constitution: the single source for every agent bridge. |
| `.sdd/config.json` | Project configuration. If it already exists, it is merged instead of overwritten (see below). |
| `.sdd/templates/*.md` | Spec, plan, tasks and EARS templates. Templates you already have are kept as they are. |
| `.sdd/specs/`, `.sdd/plans/`, `.sdd/tasks/` | Empty working folders. |
| `.sdd/specs/SPEC-000-BASELINE.md` | Baseline contract, only in brownfield mode. |
| `.agents/skills/<name>/SKILL.md` | Built-in skills, unless `--no-skills` is passed. |

### Files that `init`, `sync` and `reverse` modify, and how

`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md` and `.agents/rules/sdd-rules.md` receive a **managed block**. Everything outside the block is left byte for byte as it was:

```markdown
# Your team's CLAUDE.md          ← untouched

<!-- SDD:BEGIN -->
@.sdd/constitution.md
<!-- SDD:END -->
```

- The block is appended at the end of the file the first time. Later runs rewrite only the text between `<!-- SDD:BEGIN -->` and `<!-- SDD:END -->`.
- `CLAUDE.md` imports the constitution (`@.sdd/constitution.md`). The other bridges receive its full text, because those agents do not follow file references reliably.
- **Do not edit inside the block:** the next `sdd sync` overwrites it. Edit `.sdd/constitution.md` and run `sdd sync` instead.
- The original BOM and line endings (CRLF or LF) are preserved.
- A file that is not valid UTF-8, or whose markers are broken (a `BEGIN` without `END`, two blocks), is left untouched and reported with its line; the command exits with code 1.
- `.sdd/config.json` is merged: existing values are kept, new keys get their defaults, and only options passed explicitly on the command line (for example `--severity L3`) replace existing values. An invalid JSON file is never overwritten.
- Built-in skills are updated when their content differs from the bundled version, after a backup.

### Backups, confirmation and flags

- Before inserting the block in an existing file for the first time, SDD copies the original to `.sdd/backups/<YYYYMMDD-HHMMSS>/<path>`. Add `.sdd/backups/` to your `.gitignore`: the originals are already in your git history. SDD never edits `.gitignore` itself.
- In an interactive terminal, SDD lists the existing files it will modify and asks for confirmation. `--yes` skips the question. Without a terminal (for example, when an AI agent runs it), SDD applies the plan without asking, because inserting the block never deletes content and the original is backed up.
- `--dry-run` writes nothing and exits with the code the real run would return.

### Upgrading from SDD 1.x

`sdd sync` migrates a 1.x project in one run, with backups:

- A bridge that starts with the 1.x banner and is an exact copy of `AGENTS.md` is reduced to the block.
- A bridge that was edited after the copy keeps its text, receives the block at the end, and is reported with a warning.
- A 1.x constitution in `AGENTS.md` (`# Constitución del Proyecto: …`) is moved byte for byte to `.sdd/constitution.md`, and `AGENTS.md` keeps only the block.

### Commands that touch git

- `init`, `sync`, `reverse`, `new-spec`, `audit`, `grill`, `graph`, `review` and `ui` never run git.
- ⚠️ **`sdd run` still runs git in this version:** after each passing task it runs `git add -A` and `git commit`, and after three failed attempts it runs `git reset --hard HEAD` and `git clean -fd`, discarding every uncommitted change and untracked file in the repository. **Do not use `sdd run` in a repository with uncommitted work.** This is being fixed in [SPEC-006](.sdd/specs/SPEC-006-SAFE-RUN.md): no commits and no rollback unless you ask for them.

---

## Web Visualizer & Dashboard

Launch the local inspection dashboard to view formatted specifications, task completion status, and architecture graphs:

```bash
npx sdd-framework ui
```

```
[SDD] Local server active at: http://localhost:3333
[SDD] Opening default browser...
```

- **Metrics & KPIs:** Total specs, acceptance criteria density, task checklist progress, and EARS breakdown.
- **Contract Inspection:** Specifications rendered with color-coded EARS tags and structured Given-When-Then criteria.
- **Export to PDF / Print:** Press `Ctrl + P` or click *Print / PDF* to render an executive-grade specification sheet formatted via print stylesheets.
- **Zero Heavy Dependencies:** Implemented using native `node:http`, launching in under 100 milliseconds.

---

## Command Reference

| Command | Arguments | Description |
| :--- | :--- | :--- |
| `sdd init` | `[--severity L1\|L2\|L3] [--lang es\|en] [--graph-engine builtin\|graphify\|hybrid] [--greenfield\|--brownfield] [--no-skills] [--dry-run] [--yes]` | Initializes `.sdd/` (constitution, configuration, templates), skills, and the SDD block in the agent bridges. |
| `sdd ui` | `[--port <number>] [--no-open]` | Starts local web visualizer for specifications, micro-tasks, and project graph. |
| `sdd new-spec` | `<name>` | Scaffolds a new specification from the official EARS template in `.sdd/specs/`. |
| `sdd grill` | `<spec-file>` | Starts interactive Socratic interrogation session to detect edge cases and failure modes. |
| `sdd audit` | `[path]` | Validates specifications against formal EARS grammar and configured severity constraints. |
| `sdd reverse` | `[--dry-run] [--yes]` | Scans a brownfield codebase and creates `SPEC-000-BASELINE.md` and a reverse constitution if they are missing. |
| `sdd graph` | — | Generates compact AST and dependency graph (`.sdd/architecture-graph.md`) to minimize prompt token usage. |
| `sdd review` | `[path]` | Audits code health, detects duplication (DRY), and flags functions exceeding cyclomatic limits. |
| `sdd run` | `<tasks-file>` | Runs each task's verification command. ⚠️ Commits and rolls back with git in this version (see *Commands that touch git*). |
| `sdd sync` | `[--dry-run] [--yes]` | Updates the SDD block in `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, Copilot and Antigravity from `.sdd/constitution.md`. |

---

## EARS Requirement Grammar

SDD validates requirements against the 5 canonical EARS patterns:

| Pattern | Formal Syntax | Example |
| :--- | :--- | :--- |
| **Ubiquitous** | *The system **shall** [capability].* | The system shall persist all session records with AES-256 encryption. |
| **Event-driven** | ***WHEN** [trigger], the system **shall** [response].* | **WHEN** valid credentials are provided, the system shall issue a signed JWT. |
| **State-driven** | ***WHILE** [state], the system **shall** [behavior].* | **WHILE** the database replica is offline, the system shall serve read queries from cache. |
| **Unwanted Behavior** | ***IF** [error condition], **THEN** the system **shall** [recovery].* | **IF** token verification fails, **THEN** the system shall respond with HTTP 401 Unauthorized. |
| **Optional Feature** | ***WHERE** [feature active], the system **shall** [capability].* | **WHERE** MFA is enabled, the system shall require TOTP validation prior to token issuance. |

---

## Severity Levels

| Level | Name | Approval Threshold | Testing Standard | Human Escalation |
| :--- | :--- | :--- | :--- | :--- |
| **L1** | **Pragmatic** | Syntactic consistency, non-blocking guidance. | Smoke tests / basic coverage. | Spec drafting & delivery. |
| **L2** | **Standard** | Strict EARS notation, Given-When-Then acceptance criteria, 1:1 Requirement ↔ Task mapping. | Unit and integration verification per micro-task (≤ 30 min each). | Plan approval & architectural changes. |
| **L3** | **Draconian** | Zero tolerance for ambiguity, mandatory failure modeling (`Unwanted Behavior`), formal threat modeling. | Exhaustive edge-case validation, strict regressions before state transitions. | At every phase gatekeeper. |

---

## Development & Testing

```bash
# Clone repository
git clone https://github.com/egutierrez0323/sdd-framework.git
cd sdd-framework

# Install dependencies
npm install

# Run unit and integration tests
npm test

# Build TypeScript distribution
npm run build

# Run internal code hygiene review
npm run review
```

---

## License

Licensed under the [MIT License](./LICENSE).  
Maintained by [egutierrez0323](https://github.com/egutierrez0323).
