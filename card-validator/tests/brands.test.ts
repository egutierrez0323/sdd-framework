import { describe, it, expect } from 'vitest';
import { detectCardBrand } from '../src/brands.js';

describe('Card Brand Detection Module (REQ-CARD-03)', () => {
  it('debe identificar tarjetas VISA', () => {
    expect(detectCardBrand('4532015112830366')).toBe('VISA');
    expect(detectCardBrand('4000123456789')).toBe('VISA');
  });

  it('debe identificar tarjetas MASTERCARD', () => {
    // Rango 51-55
    expect(detectCardBrand('5105105105105100')).toBe('MASTERCARD');
    expect(detectCardBrand('5555555555554444')).toBe('MASTERCARD');
    // Rango 2221-2720 (Serie 2)
    expect(detectCardBrand('2221005112830366')).toBe('MASTERCARD');
    expect(detectCardBrand('2720995112830366')).toBe('MASTERCARD');
  });

  it('debe identificar tarjetas AMERICAN EXPRESS', () => {
    expect(detectCardBrand('340000000000000')).toBe('AMEX');
    expect(detectCardBrand('378282246310005')).toBe('AMEX');
  });

  it('debe identificar tarjetas DISCOVER', () => {
    expect(detectCardBrand('6011000990139424')).toBe('DISCOVER');
    expect(detectCardBrand('6500000000000000')).toBe('DISCOVER');
    expect(detectCardBrand('6440000000000000')).toBe('DISCOVER');
  });

  it('debe retornar UNKNOWN para prefijos no registrados o cadenas inválidas', () => {
    expect(detectCardBrand('1234567890123456')).toBe('UNKNOWN');
    expect(detectCardBrand('')).toBe('UNKNOWN');
  });
});
