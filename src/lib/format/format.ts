/**
 * CLP has no decimals and uses `.` as thousand separator on printed quotes.
 * The reference PDF (Cotizacion_5526_…) shows 484.545, 436.091, 82.857, 518.948.
 * We deliberately omit the "$" prefix here; UI code adds it when needed.
 */
export function formatCLP(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString();
  const withSeparators = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}${withSeparators}`;
}

/**
 * Formats a quantity (cantidad de items). Unlike `formatCLP`, this preserves
 * decimals — a vendor selling 2.5 metres of cable must see "2,5" on the PDF,
 * not a rounded "3", or the invariant PRECIO × Cantidad = TOTAL falls apart.
 *
 * Chilean convention: dot for thousands, comma for decimals.
 * Decimals are trimmed (no trailing zeros) and capped at 3 places to keep
 * floating-point noise out of the UI.
 */
export function formatCantidad(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  const integerPart = Math.trunc(abs);
  const fractional = abs - integerPart;

  const integerDigits = integerPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (fractional === 0) {
    return `${sign}${integerDigits}`;
  }

  // 3 decimals max, then trim trailing zeros and the decimal point if empty.
  const decimals = fractional.toFixed(3).slice(2).replace(/0+$/, '');
  return decimals.length > 0
    ? `${sign}${integerDigits},${decimals}`
    : `${sign}${integerDigits}`;
}

/**
 * Returns the date as `dd/MM/yyyy`, matching the FECHA field on the PDF.
 * Accepts ISO date strings, ISO timestamps, or Date instances. UTC-based to
 * avoid an off-by-one when the server's timezone differs from Chile's.
 */
export function formatFecha(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}
