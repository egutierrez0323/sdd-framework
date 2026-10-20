<!-- REGLAS DE DESARROLLO SDD PARA ANTIGRAVITY -->

# SDD Framework Constitution: Engineering Principles and Agent Constraints

> **SCOPE & AUTHORITY:** This constitution establishes non-negotiable architectural principles, quality constraints, and execution boundaries for the SDD Framework. Any AI coding assistant or autonomous harness operating within this repository MUST strictly comply with these directives.

---

## 1. Core Principle: Specification as Single Source of Truth

1. **Zero Unspecified Production Code:** No production code shall be introduced or modified without a prior requirement identifier (`REQ-ID`) documented in an approved specification and an associated micro-task in `.sdd/tasks/`.
2. **Deterministic Engineering Over Heuristic Intuition:** When evaluating architectural or implementation alternatives, the agent must prioritize options that are measurable, strictly typed, verifiable via automated tests, and formulated in standard EARS syntax.
3. **Execution Scope Immutability:** Once a specification and technical plan are marked as `APPROVED`, the agent MUST NOT unilaterally expand scope, introduce unplanned third-party dependencies, or alter public API signatures without explicit human approval.
4. **Anti-Sycophancy Guard (Architectural Devil's Advocate):** The agent is explicitly prohibited from acting as a passive "yes-man". If the technical lead, developer, or user provides an instruction that violates constitutional constraints, introduces security vulnerabilities (OWASP Top 10), or causes undocumented breaking changes against baseline contracts (`SPEC-000-BASELINE.md`), the agent MUST issue a structured conflict alert, detail the trade-offs, and require conscious confirmation before proceeding.
5. **Pre-Flight Codebase Verification:** Before querying the human technical lead, the agent MUST inspect the repository and project dependency graph (`.sdd/architecture-graph.md`). Any question whose answer is already established by existing codebase patterns, configurations, or interfaces must be resolved autonomously. Only genuine business trade-offs, infrastructure costs, or irreversible decisions shall be escalated to the human lead, accompanied by a recommended resolution prefixed with `(Recomendado)`.

---

## 2. Verification Severity Levels

The framework defines three configurable audit levels:

| Level | Identifier | Specification Criteria | Testing Enforcement | Human Intervention Points |
| :--- | :--- | :--- | :--- | :--- |
| **L1** | **Pragmatic (Velocity)** | Syntactic consistency, basic EARS structures, non-blocking warnings. | Smoke tests and core functional validation. | Spec drafting and final delivery. |
| **L2** | **Standard (Production)** | Strict EARS notation, Given-When-Then acceptance criteria, 1:1 Requirement ↔ Task mapping. | Unit and integration coverage per micro-task (≤ 30 min each). | Plan approval and architectural revisions. |
| **L3** | **Draconian (Mission-Critical)** | Zero tolerance for ambiguous terms, mandatory failure recovery modeling (`Unwanted Behavior`), formal threat modeling. | Strict edge-case coverage and regression validation prior to state transitions. | At every phase gatekeeper. |

---

## 3. Autonomous Execution Protocol

1. **Pre-Conditions for Autonomous Execution:** The agent may only execute automated loops (e.g. via `sdd run` or continuous execution harnesses) after:
   - `spec.md` is in state `APPROVED`.
   - `plan.md` is in state `APPROVED`.
   - `tasks.md` contains discrete, atomic tasks (estimated at ≤ 30 minutes each) with an executable verification command.
2. **Task Execution Lifecycle (Red → Green → Refactor):**
   - Load only the context required for the active micro-task.
   - Implement the test and minimal production code until the verification command passes (*Green*).
   - **Mandatory Clean Code Review Pass:** Before closing the task, the agent must evaluate the diff against Single Responsibility (SRP) and DRY principles. Any unnecessary duplication or cyclomatic complexity must be refactored while maintaining green tests.
   - Run automated validation and ensure code health score ≥ 85 (`sdd review`).
   - If verification fails: Maximum of **3 automated correction cycles**. If failure persists, the agent must pause, execute a clean rollback, and output a blocking report detailing the root cause.
   - If verification passes: Mark `[x]` in `tasks.md`, execute a semantic commit (`feat(REQ-X): description`), and advance to the subsequent task.

---

## 4. Technical Conventions and Standards

- **Runtime:** Node.js (Active LTS), ESM modules (`"type": "module"`).
- **Language:** TypeScript with strict configuration (`"strict": true`, no unjustified `any`).
- **Testing:** Vitest for deterministic, fast unit and integration tests.
- **Code Hygiene:** Clean Code standards, functions under 55 lines, Guard Clauses over nested conditionals, single responsibility per module.
- **Documentation:** All architectural updates must be reflected in `.sdd/` and tracked in `README.md`.
