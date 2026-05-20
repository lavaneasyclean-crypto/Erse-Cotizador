/**
 * Chilean RUT helpers. The check-digit algorithm is identical for personas
 * naturales and personas jurídicas — only the numeric range differs. We never
 * branch by "company vs individual" here.
 *
 * Canonical format: dot-separated millions, dash before DV, uppercase K.
 *   77.638.085-7  · 17.478.566-K
 */

/** Strip dots/spaces and uppercase any trailing K. */
function clean(raw: string): string {
  return raw.replace(/\./g, '').replace(/\s/g, '').toUpperCase();
}

/** Parse a cleaned RUT into body + dv, or return null if it doesn't look like one. */
function parse(raw: string): { body: string; dv: string } | null {
  // 7–8 digit body covers every legal Chilean RUT (>99 million doesn't exist yet).
  const match = /^(\d{7,8})-?([0-9K])$/.exec(clean(raw));
  if (!match) return null;
  return { body: match[1], dv: match[2] };
}

export function computeCheckDigit(body: string): string {
  const digits = body.split('').reverse().map(Number);
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    // Multipliers cycle 2..7, then restart at 2.
    const multiplier = (i % 6) + 2;
    sum += digits[i] * multiplier;
  }
  const residue = 11 - (sum % 11);
  if (residue === 11) return '0';
  if (residue === 10) return 'K';
  return String(residue);
}

export function isValidRut(raw: string): boolean {
  const parsed = parse(raw);
  if (!parsed) return false;
  return computeCheckDigit(parsed.body) === parsed.dv;
}

/** Insert dots and dash into a parseable RUT. Returns the input unchanged when it can't parse. */
export function formatRut(raw: string): string {
  const parsed = parse(raw);
  if (!parsed) return raw;
  const withDots = parsed.body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${withDots}-${parsed.dv}`;
}

/** DB-friendly form: no dots, dash kept, uppercase K. Used at insert/update time. */
export function normalizeRut(raw: string): string {
  const parsed = parse(raw);
  if (!parsed) return raw;
  return `${parsed.body}-${parsed.dv}`;
}
