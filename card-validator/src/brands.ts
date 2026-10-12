import { CardBrand } from './types.js';

interface BrandRule {
  brand: CardBrand;
  lengths: number[];
  checkPrefix: (digits: string) => boolean;
}

const BRAND_RULES: BrandRule[] = [
  {
    brand: 'AMEX',
    lengths: [15],
    checkPrefix: (d) => /^3[47]/.test(d),
  },
  {
    brand: 'VISA',
    lengths: [13, 16, 19],
    checkPrefix: (d) => /^4/.test(d),
  },
  {
    brand: 'MASTERCARD',
    lengths: [16],
    checkPrefix: (d) => {
      // 51-55
      if (/^5[1-5]/.test(d)) return true;
      // 2221-2720
      if (/^\d{4}/.test(d)) {
        const prefix4 = parseInt(d.slice(0, 4), 10);
        return prefix4 >= 2221 && prefix4 <= 2720;
      }
      return false;
    },
  },
  {
    brand: 'DISCOVER',
    lengths: [16, 19],
    checkPrefix: (d) => {
      if (/^(6011|65)/.test(d)) return true;
      if (/^64[4-9]/.test(d)) return true;
      if (/^\d{6}/.test(d)) {
        const prefix6 = parseInt(d.slice(0, 6), 10);
        return prefix6 >= 622126 && prefix6 <= 622925;
      }
      return false;
    },
  },
];

/**
 * Detecta la franquicia o red emisora del número de tarjeta normalizado.
 *
 * @param normalizedDigits - Cadena numérica con los dígitos de la tarjeta
 * @returns CardBrand ('VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'UNKNOWN')
 */
export function detectCardBrand(normalizedDigits: string): CardBrand {
  if (typeof normalizedDigits !== 'string' || !/^\d+$/.test(normalizedDigits)) {
    return 'UNKNOWN';
  }

  const len = normalizedDigits.length;

  for (const rule of BRAND_RULES) {
    if (rule.lengths.includes(len) && rule.checkPrefix(normalizedDigits)) {
      return rule.brand;
    }
  }

  return 'UNKNOWN';
}
