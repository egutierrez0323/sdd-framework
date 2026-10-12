import { describe, it, expect } from 'vitest';
import { validateExpiration } from '../src/expiration.js';

describe('Expiration Date Validation Module (REQ-CARD-04)', () => {
  // Fecha de referencia fija: 15 de Octubre de 2026
  const referenceDate = new Date(2026, 9, 15); // Mes 9 es Octubre en JS (0-indexed)

  it('debe aceptar tarjetas que vencen en el mes corriente', () => {
    // Octubre 2026 (mes 10)
    expect(validateExpiration(10, 2026, referenceDate)).toBe(true);
    expect(validateExpiration(10, 26, referenceDate)).toBe(true); // 2 dígitos
  });

  it('debe aceptar fechas futuras', () => {
    expect(validateExpiration(11, 2026, referenceDate)).toBe(true); // Próximo mes
    expect(validateExpiration(1, 2027, referenceDate)).toBe(true);  // Próximo año
    expect(validateExpiration(5, 30, referenceDate)).toBe(true);    // 2030 en 2 dígitos
  });

  it('debe rechazar fechas en el pasado', () => {
    expect(validateExpiration(9, 2026, referenceDate)).toBe(false); // Septiembre 2026 ya pasó
    expect(validateExpiration(12, 2025, referenceDate)).toBe(false); // 2025 ya pasó
    expect(validateExpiration(12, 25, referenceDate)).toBe(false);
  });

  it('debe rechazar meses inválidos fuera de 1 a 12', () => {
    expect(validateExpiration(0, 2027, referenceDate)).toBe(false);
    expect(validateExpiration(13, 2027, referenceDate)).toBe(false);
    expect(validateExpiration(-1, 2027, referenceDate)).toBe(false);
  });

  it('debe rechazar valores nulos, no numéricos o NaN', () => {
    expect(validateExpiration(NaN, 2027, referenceDate)).toBe(false);
    expect(validateExpiration(10, NaN, referenceDate)).toBe(false);
    expect(validateExpiration(undefined as unknown as number, 2027, referenceDate)).toBe(false);
  });
});
