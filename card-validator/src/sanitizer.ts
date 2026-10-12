/**
 * Sanitiza una cadena que representa un número de tarjeta,
 * eliminando espacios, guiones y cualquier carácter que no sea un dígito numérico.
 *
 * @param raw - Cadena original de entrada
 * @returns Cadena normalizada que contiene únicamente dígitos del 0 al 9
 */
export function sanitizeCardNumber(raw: string): string {
  if (typeof raw !== 'string' || !raw) {
    return '';
  }
  return raw.replace(/\D/g, '');
}
