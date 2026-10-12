import { describe, it, expect } from 'vitest';
import { validateLuhn } from '../src/luhn.js';

describe('Luhn Algorithm Module (REQ-CARD-02)', () => {
  it('debe validar números de tarjeta auténticos válidos', () => {
    // Tarjetas de prueba estándar válidas según Luhn
    expect(validateLuhn('4532015112830366')).toBe(true); // Visa
    expect(validateLuhn('5555555555554444')).toBe(true); // Mastercard
    expect(validateLuhn('378282246310005')).toBe(true);  // Amex (15 dígitos)
    expect(validateLuhn('6011000990139424')).toBe(true); // Discover
  });

  it('debe rechazar números con dígito verificador alterado', () => {
    expect(validateLuhn('4532015112830367')).toBe(false); // Checksum incorrecto
    expect(validateLuhn('5555555555554445')).toBe(false);
  });

  it('debe rechazar cadenas fuera del rango de longitud (13-19 dígitos)', () => {
    expect(validateLuhn('123456789012')).toBe(false); // 12 dígitos (muy corto)
    expect(validateLuhn('12345678901234567890')).toBe(false); // 20 dígitos (muy largo)
  });

  it('debe rechazar cadenas vacías o con caracteres no numéricos', () => {
    expect(validateLuhn('')).toBe(false);
    expect(validateLuhn('4532-0151-1283-0366')).toBe(false); // No normalizada
    expect(validateLuhn('abcdef123456789')).toBe(false);
  });
});
