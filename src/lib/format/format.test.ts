import { describe, it, expect } from 'vitest';

import { formatCLP, formatCantidad, formatFecha } from '@/lib/format/format';

describe('formatCLP', () => {
  it('formats with dot as thousand separator and no currency symbol (PDF style)', () => {
    expect(formatCLP(484_545)).toBe('484.545');
    expect(formatCLP(436_091)).toBe('436.091');
    expect(formatCLP(82_857)).toBe('82.857');
    expect(formatCLP(518_948)).toBe('518.948');
  });

  it('handles zero and small numbers', () => {
    expect(formatCLP(0)).toBe('0');
    expect(formatCLP(50)).toBe('50');
    expect(formatCLP(999)).toBe('999');
    expect(formatCLP(1_000)).toBe('1.000');
  });

  it('rounds non-integer values to nearest CLP (no decimals)', () => {
    expect(formatCLP(99.4)).toBe('99');
    expect(formatCLP(99.5)).toBe('100');
  });

  it('renders negative amounts with a leading minus', () => {
    // Used by credit notes / reversals later; spec it now.
    expect(formatCLP(-1_500)).toBe('-1.500');
  });
});

describe('formatCantidad', () => {
  it('formats whole numbers like CLP but without decimals (no rounding)', () => {
    expect(formatCantidad(1)).toBe('1');
    expect(formatCantidad(10)).toBe('10');
    expect(formatCantidad(1_500)).toBe('1.500');
  });

  it('preserves decimals using a Chilean comma', () => {
    // 2.5 metres of cable must NOT round to 3 — the PDF invariant
    // PRECIO × Cantidad = TOTAL breaks otherwise (see ADR 003).
    expect(formatCantidad(2.5)).toBe('2,5');
    expect(formatCantidad(0.75)).toBe('0,75');
    expect(formatCantidad(1_500.5)).toBe('1.500,5');
  });

  it('trims trailing zeros to keep the display tidy', () => {
    expect(formatCantidad(2.5)).toBe('2,5');
    expect(formatCantidad(2.0)).toBe('2');
  });

  it('caps decimals at 3 places so floating point noise does not leak', () => {
    expect(formatCantidad(1 / 3)).toBe('0,333');
    expect(formatCantidad(2.123456)).toBe('2,123');
  });

  it('handles zero and negative quantities', () => {
    expect(formatCantidad(0)).toBe('0');
    expect(formatCantidad(-1.5)).toBe('-1,5');
  });
});

describe('formatFecha', () => {
  it('formats ISO date strings as dd/MM/yyyy to match the PDF', () => {
    expect(formatFecha('2026-04-27')).toBe('27/04/2026');
    expect(formatFecha('2026-01-09')).toBe('09/01/2026');
  });

  it('accepts a full ISO timestamp and drops the time', () => {
    expect(formatFecha('2026-04-27T13:45:21.123Z')).toBe('27/04/2026');
  });

  it('accepts a Date instance', () => {
    expect(formatFecha(new Date(Date.UTC(2026, 3, 27)))).toBe('27/04/2026');
  });
});
