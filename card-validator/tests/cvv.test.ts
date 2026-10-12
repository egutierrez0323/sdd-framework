import { describe, it, expect } from 'vitest';
import { validateCvv } from '../src/cvv.js';

describe('CVV/CVC Validation Module (REQ-CARD-05)', () => {
  it('debe validar CVV de 4 dígitos para American Express', () => {
    expect(validateCvv('1234', 'AMEX')).toBe(true);
    expect(validateCvv('0000', 'AMEX')).toBe(true);
    // Rechazar 3 dígitos en Amex
    expect(validateCvv('123', 'AMEX')).toBe(false);
  });

  it('debe validar CVV de 3 dígitos para Visa, Mastercard y Discover', () => {
    expect(validateCvv('123', 'VISA')).toBe(true);
    expect(validateCvv('789', 'MASTERCARD')).toBe(true);
    expect(validateCvv('456', 'DISCOVER')).toBe(true);
    // Rechazar 4 dígitos en estas marcas
    expect(validateCvv('1234', 'VISA')).toBe(false);
    expect(validateCvv('1234', 'MASTERCARD')).toBe(false);
  });

  it('debe aceptar 3 o 4 dígitos cuando la marca es UNKNOWN o no especificada', () => {
    expect(validateCvv('123')).toBe(true);
    expect(validateCvv('1234')).toBe(true);
    expect(validateCvv('12', 'UNKNOWN')).toBe(false);
    expect(validateCvv('12345', 'UNKNOWN')).toBe(false);
  });

  it('debe rechazar CVVs con letras, espacios o caracteres especiales', () => {
    expect(validateCvv('12a', 'VISA')).toBe(false);
    expect(validateCvv(' 12', 'VISA')).toBe(false);
    expect(validateCvv('12#4', 'AMEX')).toBe(false);
    expect(validateCvv('')).toBe(false);
    expect(validateCvv(null as unknown as string)).toBe(false);
  });
});
