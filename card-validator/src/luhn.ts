/**
 * Valida un número de tarjeta de crédito empleando el algoritmo de Luhn (Módulo 10).
 *
 * @param normalizedDigits - Cadena compuesta exclusivamente por dígitos normalizados
 * @returns boolean indicando si el dígito de verificación es correcto
 */
export function validateLuhn(normalizedDigits: string): boolean {
  if (typeof normalizedDigits !== 'string') {
    return false;
  }

  // Comprobar que solo contenga dígitos
  if (!/^\d+$/.test(normalizedDigits)) {
    return false;
  }

  // Longitud estándar permitida por redes de tarjetas (13 a 19 dígitos)
  const len = normalizedDigits.length;
  if (len < 13 || len > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  // Recorrer de derecha a izquierda
  for (let i = len - 1; i >= 0; i--) {
    let digit = normalizedDigits.charCodeAt(i) - 48; // '0' es 48 en ASCII

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}
