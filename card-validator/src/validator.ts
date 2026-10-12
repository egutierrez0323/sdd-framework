import { CardBrand, CardInput, CardValidationResult } from './types.js';
import { sanitizeCardNumber } from './sanitizer.js';
import { validateLuhn } from './luhn.js';
import { detectCardBrand } from './brands.js';
import { validateExpiration } from './expiration.js';
import { validateCvv } from './cvv.js';

function checkExpiration(input: CardInput, errors: string[]): boolean | undefined {
  if (input.expMonth === undefined && input.expYear === undefined) {
    return undefined;
  }
  if (input.expMonth === undefined || input.expYear === undefined) {
    errors.push('Fecha de expiración incompleta (se requiere mes y año)');
    return false;
  }
  const valid = validateExpiration(input.expMonth, input.expYear);
  if (!valid) {
    errors.push('Fecha de expiración vencida o mes/año inválido');
  }
  return valid;
}

function checkCvv(cvv: string | undefined, brand: CardBrand, errors: string[]): boolean | undefined {
  if (cvv === undefined) {
    return undefined;
  }
  const valid = validateCvv(cvv, brand);
  if (!valid) {
    errors.push(`Código de seguridad (CVV) inválido para franquicia ${brand}`);
  }
  return valid;
}

function checkCardNumber(normalized: string, errors: string[]): { brand: CardBrand; luhnValid: boolean } {
  if (!normalized || normalized.length < 13 || normalized.length > 19) {
    errors.push('Número de tarjeta inválido o longitud fuera de rango (13-19)');
  }
  const brand = detectCardBrand(normalized);
  if (normalized && brand === 'UNKNOWN') {
    errors.push('Franquicia no identificada o no soportada');
  }
  const luhnValid = validateLuhn(normalized);
  if (normalized && !luhnValid) {
    errors.push('Dígito de control inválido (falla algoritmo de Luhn)');
  }
  return { brand, luhnValid };
}

/**
 * Validador integral de tarjetas de crédito.
 * Orquesta la verificación de número, algoritmo de Luhn, franquicia,
 * fecha de expiración y código de seguridad CVV con tolerancia a fallos.
 *
 * @param input - Datos de la tarjeta a evaluar
 * @returns CardValidationResult con el estado y desglose de cada comprobación
 */
export function validateCreditCard(input: CardInput): CardValidationResult {
  if (!input || typeof input !== 'object') {
    return {
      isValid: false,
      brand: 'UNKNOWN',
      luhnValid: false,
      errors: ['Entrada nula o inválida'],
    };
  }

  const errors: string[] = [];
  const normalized = sanitizeCardNumber(input.cardNumber);
  const { brand, luhnValid } = checkCardNumber(normalized, errors);
  const expirationValid = checkExpiration(input, errors);
  const cvvValid = checkCvv(input.cvv, brand, errors);

  const isValid =
    errors.length === 0 &&
    luhnValid &&
    brand !== 'UNKNOWN' &&
    (expirationValid ?? true) &&
    (cvvValid ?? true);

  return {
    isValid,
    brand,
    luhnValid,
    expirationValid,
    cvvValid,
    errors,
  };
}
