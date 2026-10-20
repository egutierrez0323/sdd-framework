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
- Agent bridges (`.cursorrules`, `CLAUDE.md`, `AGENTS.md`).
- Core templates and skill definitions.

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
| `sdd init` | `[--severity L1\|L2\|L3] [--greenfield\|--brownfield] [--yes]` | Initializes `.sdd/` directory, configuration, templates, and agent bridges. |
| `sdd ui` | `[--port <number>] [--no-open]` | Starts local web visualizer for specifications, micro-tasks, and project graph. |
| `sdd new-spec` | `<name>` | Scaffolds a new specification from the official EARS template in `.sdd/specs/`. |
| `sdd grill` | `<spec-file>` | Starts interactive Socratic interrogation session to detect edge cases and failure modes. |
| `sdd audit` | `[path]` | Validates specifications against formal EARS grammar and configured severity constraints. |
| `sdd reverse` | — | Performs reverse engineering scan on brownfield codebases to generate `SPEC-000-BASELINE.md`. |
| `sdd graph` | — | Generates compact AST and dependency graph (`.sdd/architecture-graph.md`) to minimize prompt token usage. |
| `sdd review` | `[path]` | Audits code health, detects duplication (DRY), and flags functions exceeding cyclomatic limits. |
| `sdd run` | `<tasks-file>` | Executes autonomous task verification loop with automated rollback upon repeated test failure. |
| `sdd sync` | — | Synchronizes `AGENTS.md` rules with Cursor (`.cursorrules`), Claude Code (`CLAUDE.md`), and Copilot. |

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
