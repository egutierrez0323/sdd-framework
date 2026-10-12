import { describe, it, expect } from 'vitest';
import { validateCreditCard } from '../src/validator.js';

describe('Unified Credit Card Validator (REQ-CARD-06 & REQ-CARD-07)', () => {
  it('debe validar exitosamente una tarjeta Visa completa y vigente', () => {
    const result = validateCreditCard({
      cardNumber: '4532 0151 1283 0366',
      expMonth: 12,
      expYear: 2030,
      cvv: '123',
    });

    expect(result.isValid).toBe(true);
    expect(result.brand).toBe('VISA');
    expect(result.luhnValid).toBe(true);
    expect(result.expirationValid).toBe(true);
    expect(result.cvvValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('debe validar exitosamente una tarjeta Amex con CVV de 4 dígitos', () => {
    const result = validateCreditCard({
      cardNumber: '3782-8224-6310-005',
      expMonth: 8,
      expYear: 2028,
      cvv: '1234',
    });

    expect(result.isValid).toBe(true);
    expect(result.brand).toBe('AMEX');
    expect(result.luhnValid).toBe(true);
    expect(result.cvvValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('debe reportar error si la fecha de expiración está vencida', () => {
    const result = validateCreditCard({
      cardNumber: '4532015112830366',
      expMonth: 1,
      expYear: 2020, // Pasado
    });

    expect(result.isValid).toBe(false);
    expect(result.expirationValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('expiración');
  });

  it('debe reportar error si el CVV no coincide con la marca', () => {
    const result = validateCreditCard({
      cardNumber: '378282246310005', // Amex requiere 4 dígitos
      cvv: '123', // Solo 3
    });

    expect(result.isValid).toBe(false);
    expect(result.cvvValid).toBe(false);
    expect(result.errors.some((e) => e.includes('CVV'))).toBe(true);
  });

  it('debe manejar defensivamente entradas nulas, vacías o corruptas sin arrojar excepciones (REQ-CARD-06)', () => {
    // Objeto nulo
    const resNull = validateCreditCard(null as unknown as { cardNumber: string });
    expect(resNull.isValid).toBe(false);
    expect(resNull.errors.length).toBeGreaterThan(0);

    // Entrada vacía
    const resEmpty = validateCreditCard({ cardNumber: '' });
    expect(resEmpty.isValid).toBe(false);
    expect(resEmpty.errors.length).toBeGreaterThan(0);

    // Entrada con letras
    const resChars = validateCreditCard({ cardNumber: 'tarjeta-invalida' });
    expect(resChars.isValid).toBe(false);
    expect(resChars.errors.length).toBeGreaterThan(0);
  });
});
