import { CardBrand } from './types.js';

/**
 * Valida el código de seguridad (CVV / CVC / CID) de acuerdo con la franquicia.
 *
 * @param cvv - Cadena con el código de seguridad
 * @param brand - Franquicia identificada (opcional)
 * @returns boolean indicando si el formato y longitud del CVV son válidos
 */
export function validateCvv(cvv: string, brand?: CardBrand): boolean {
  if (typeof cvv !== 'string' || !/^\d+$/.test(cvv)) {
    return false;
  }

  if (brand === 'AMEX') {
    return cvv.length === 4;
  }

  if (brand === 'VISA' || brand === 'MASTERCARD' || brand === 'DISCOVER') {
    return cvv.length === 3;
  }

  // Si no se conoce la marca o es UNKNOWN, se aceptan longitudes estándar (3 o 4)
  return cvv.length === 3 || cvv.length === 4;
}
