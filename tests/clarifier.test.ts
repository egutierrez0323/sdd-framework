import { describe, it, expect } from 'vitest';
import {
  generateClarificationSession,
  runAutoGrillSession,
  auditArchitectDecision,
  injectDecisionsIntoSpec,
} from '../src/core/clarifier.js';

describe('Clarifier & Socratic Inquisitor Module', () => {
  const sampleSpec = `# SPEC-001: Autenticación de Usuarios
- Estado: DRAFT

### REQ-001-01: Login con Credenciales
- **Tipo EARS:** Event-driven
- **Declaración:**
  > CUANDO el usuario envía credenciales de autenticación válidas, el sistema deberá emitir un token JWT.
- **Criterio de Aceptación:**
  - **DADO:** Usuario registrado.
  - **CUANDO:** Envía POST /login.
  - **ENTONCES:** Recibe token.
`;

  it('should generate structured questions with recommended options', () => {
    const questions = generateClarificationSession(sampleSpec, 'L2');
    expect(questions.length).toBeGreaterThan(0);

    for (const q of questions) {
      expect(q.options).toBeDefined();
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options[0]).toContain('(Recomendado)');
    }
  });

  it('should auto-resolve questions when codebase context already solves them (Auto-Grill)', () => {
    const session = runAutoGrillSession(sampleSpec, 'L2', {
      hasAuth: true,
      hasDatabase: true,
    });

    expect(session.autoResolved.some((q) => q.id === 'CLARIFY-03')).toBe(true);
    expect(session.escalatedToHuman.every((q) => q.id !== 'CLARIFY-03')).toBe(true);
  });

  describe('Anti-Sycophancy / Devil\'s Advocate Auditor', () => {
    it('should flag returning 200 OK on authentication failure', () => {
      const violations = auditArchitectDecision('Devolver 200 OK con mensaje de error si la autenticación falla');
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].ruleId).toBe('DEVIL-01');
      expect(violations[0].severity).toBe('CRITICAL');
    });

    it('should flag storing passwords or tokens in plain text or localStorage', () => {
      const violations = auditArchitectDecision('Guardar el password en texto plano para verificarlo rápido');
      expect(violations.some((v) => v.ruleId === 'DEVIL-02')).toBe(true);
    });

    it('should flag silencing exceptions without logging', () => {
      const violations = auditArchitectDecision('Hacer un catch vacío e ignorar el error');
      expect(violations.some((v) => v.ruleId === 'DEVIL-03')).toBe(true);
    });

    it('should flag skipping tests', () => {
      const violations = auditArchitectDecision('Omitir los tests porque hay prisa por lanzar');
      expect(violations.some((v) => v.ruleId === 'DEVIL-04')).toBe(true);
    });

    it('should pass cleanly for compliant, robust engineering decisions', () => {
      const violations = auditArchitectDecision(
        'Retornar HTTP 401 Unauthorized para credenciales inválidas y aplicar rate limiting por IP'
      );
      expect(violations.length).toBe(0);
    });
  });

  it('should inject binding decisions into spec and mark as APPROVED', () => {
    const decisions = [
      {
        questionId: 'CLARIFY-01',
        category: 'Failure Recovery',
        decision: 'Reintentos exponenciales con límite de 3 y respuesta HTTP 503',
      },
    ];

    const updated = injectDecisionsIntoSpec(sampleSpec, decisions);
    expect(updated).toContain('Estado: APPROVED');
    expect(updated).toContain('## 3. Registro de Clarificación Socrática y Decisiones de Arquitectura');
    expect(updated).toContain('Reintentos exponenciales con límite de 3');
  });
});
