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
