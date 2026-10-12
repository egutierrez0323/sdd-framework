import { describe, it, expect } from 'vitest';
import { sanitizeCardNumber } from '../src/sanitizer.js';

describe('Sanitizer Module (REQ-CARD-01)', () => {
  it('debe eliminar espacios en blanco de la tarjeta', () => {
    expect(sanitizeCardNumber('4532 1234 5678 9010')).toBe('4532123456789010');
  });

  it('debe eliminar guiones y separadores', () => {
    expect(sanitizeCardNumber('4532-1234-5678-9010')).toBe('4532123456789010');
  });

  it('debe eliminar caracteres no numéricos arbitrarios', () => {
    expect(sanitizeCardNumber('4532.1234#5678*9010abc')).toBe('4532123456789010');
  });

  it('debe retornar cadena vacía ante entrada nula, indefinida o vacía', () => {
    expect(sanitizeCardNumber('')).toBe('');
    expect(sanitizeCardNumber(null as unknown as string)).toBe('');
    expect(sanitizeCardNumber(undefined as unknown as string)).toBe('');
  });
});
