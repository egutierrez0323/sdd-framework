/**
 * Valida la fecha de expiración de una tarjeta de crédito.
 *
 * @param month - Mes en formato 1-12
 * @param year - Año en formato de 2 o 4 dígitos (ej. 26 o 2026)
 * @param now - Fecha de referencia opcional (por defecto new Date())
 * @returns boolean indicando si la tarjeta aún se encuentra vigente
 */
export function validateExpiration(month: number, year: number, now: Date = new Date()): boolean {
  if (
    typeof month !== 'number' ||
    typeof year !== 'number' ||
    Number.isNaN(month) ||
    Number.isNaN(year)
  ) {
    return false;
  }

  // Validación de rango de mes
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return false;
  }

  if (!Number.isInteger(year) || year < 0) {
    return false;
  }

  // Normalizar año si viene en 2 dígitos (ej: 26 -> 2026)
  const fullYear = year < 100 ? 2000 + year : year;

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // getMonth() retorna 0-11

  if (fullYear > currentYear) {
    return true;
  }

  if (fullYear === currentYear) {
    return month >= currentMonth;
  }

  return false;
}
