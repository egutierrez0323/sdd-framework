import { describe, it, expect } from 'vitest';
import { parseSpecMarkdown, validateSpec } from '../src/core/ears-validator.js';

describe('EARS Validator Module', () => {
  const sampleValidSpec = `
# SPEC-001: Test Spec

### REQ-001-01: Login Event
- **Tipo EARS:** Event-driven
- **Declaración:**
  > CUANDO el usuario envíe credenciales válidas, el sistema deberá generar un token JWT.
- **Criterio de Aceptación:**
  - **DADO:** Un usuario registrado.
  - **CUANDO:** Envía POST /login.
  - **ENTONCES:** Recibe 200 OK con token.

### REQ-001-02: Manejo de Errores
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > SI la contraseña es inválida, ENTONCES el sistema deberá responder con código 401.
- **Criterio de Aceptación:**
  - **DADO:** Contraseña errónea.
  - **CUANDO:** Se intenta autenticar.
  - **ENTONCES:** Retorna 401 Unauthorized.
`;

  it('should parse requirements correctly', () => {
    const reqs = parseSpecMarkdown(sampleValidSpec);
    expect(reqs).toHaveLength(2);
    expect(reqs[0].id).toBe('REQ-001-01');
    expect(reqs[0].type).toBe('Event-driven');
    expect(reqs[0].acceptanceCriteria.given).toBe('Un usuario registrado.');
    expect(reqs[1].id).toBe('REQ-001-02');
    expect(reqs[1].type).toBe('Unwanted Behavior');
  });

  it('should pass validation under L2 severity for compliant spec', () => {
    const report = validateSpec(sampleValidSpec, 'L2');
    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it('should fail under L2 if requirement lacks Given-When-Then', () => {
    const brokenSpec = `
### REQ-001-01: Incompleto
- **Tipo EARS:** Event-driven
- **Declaración:**
  > CUANDO ocurre un clic, el sistema deberá responder.
`;
    const report = validateSpec(brokenSpec, 'L2');
    expect(report.valid).toBe(false);
    expect(report.errors.length).toBeGreaterThan(0);
    expect(report.errors[0].message).toContain('Criterio de aceptación incompleto');
  });

  it('should detect vague words under L3 severity', () => {
    const vagueSpec = `
### REQ-001-01: Vago
- **Tipo EARS:** Event-driven
- **Declaración:**
  > CUANDO el usuario presione el botón, el sistema deberá responder de forma rápida y eficiente.
- **Criterio de Aceptación:**
  - **DADO:** Inicio.
  - **CUANDO:** Clic.
  - **ENTONCES:** Éxito.

### REQ-001-02: Error
- **Tipo EARS:** Unwanted Behavior
- **Declaración:**
  > SI hay fallo, ENTONCES el sistema deberá mostrar alerta.
- **Criterio de Aceptación:**
  - **DADO:** Fallo.
  - **CUANDO:** Ocurre.
  - **ENTONCES:** Alerta.
`;
    const report = validateSpec(vagueSpec, 'L3');
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.message.includes('Palabra ambigua'))).toBe(true);
  });
});
