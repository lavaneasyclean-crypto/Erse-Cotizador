import { describe, it, expect } from 'vitest';

import {
  IVA_RATE,
  lineTotal,
  computeTotals,
  unitNet,
  type QuoteLine,
} from '@/lib/cotizaciones/totals';

describe('lineTotal', () => {
  it('multiplies unit price by quantity when there is no discount', () => {
    expect(lineTotal({ precioUnitario: 484_545, cantidad: 1, descuentoPorcentaje: 0 })).toBe(
      484_545,
    );
  });

  it('applies a percentage discount on top of price × quantity', () => {
    // The reference PDF (Cotizacion_5526_…) showed 484.545 × 1 × (1 - 10%) = 436.091 after
    // rounding. This anchors the rounding rule: round to the nearest integer (CLP, no decimals).
    expect(lineTotal({ precioUnitario: 484_545, cantidad: 1, descuentoPorcentaje: 10 })).toBe(
      436_091,
    );
  });

  it('handles fractional quantities (e.g. metres of cable)', () => {
    expect(lineTotal({ precioUnitario: 1_000, cantidad: 2.5, descuentoPorcentaje: 0 })).toBe(2_500);
  });

  it('rounds half-up to keep totals matching the printed PDF', () => {
    // 100 × 1 × 0.995 = 99.5 → must round to 100, not 99.
    expect(lineTotal({ precioUnitario: 100, cantidad: 1, descuentoPorcentaje: 0.5 })).toBe(100);
  });

  it('rejects negative quantities', () => {
    expect(() =>
      lineTotal({ precioUnitario: 100, cantidad: -1, descuentoPorcentaje: 0 }),
    ).toThrowError(/cantidad/i);
  });

  it('rejects negative prices', () => {
    expect(() =>
      lineTotal({ precioUnitario: -1, cantidad: 1, descuentoPorcentaje: 0 }),
    ).toThrowError(/precio/i);
  });

  it('rejects discount above 100 or below 0', () => {
    expect(() =>
      lineTotal({ precioUnitario: 100, cantidad: 1, descuentoPorcentaje: 101 }),
    ).toThrowError(/descuento/i);
    expect(() =>
      lineTotal({ precioUnitario: 100, cantidad: 1, descuentoPorcentaje: -1 }),
    ).toThrowError(/descuento/i);
  });

  it('rounds the unit price first so PDF math (PRECIO × Cantidad = TOTAL) holds with cantidad > 1', () => {
    // 100 × (1 - 33.333%) = 66.667 → rounds to 67. Then 67 × 3 = 201.
    // If we instead rounded only at the end, we'd get round(100 × 3 × 0.66667) = 200,
    // and the PDF row would show 67 × 3 = 201, contradicting the line total.
    expect(lineTotal({ precioUnitario: 100, cantidad: 3, descuentoPorcentaje: 33.333 })).toBe(
      201,
    );
  });
});

describe('unitNet', () => {
  it('returns the unit price after discount, rounded to CLP', () => {
    expect(unitNet({ precioUnitario: 484_545, descuentoPorcentaje: 10 })).toBe(436_091);
    expect(unitNet({ precioUnitario: 100, descuentoPorcentaje: 33.333 })).toBe(67);
    expect(unitNet({ precioUnitario: 1_000, descuentoPorcentaje: 0 })).toBe(1_000);
  });
});

describe('computeTotals', () => {
  it('returns zeroes when the quote has no lines', () => {
    expect(computeTotals([])).toEqual({ subtotal: 0, iva: 0, total: 0 });
  });

  it('sums line totals into subtotal, then adds 19% IVA', () => {
    const lines: QuoteLine[] = [
      { precioUnitario: 100_000, cantidad: 2, descuentoPorcentaje: 0 }, // 200_000
      { precioUnitario: 50_000, cantidad: 1, descuentoPorcentaje: 10 }, //  45_000
    ];

    expect(computeTotals(lines)).toEqual({
      subtotal: 245_000,
      iva: 46_550, // 245_000 * 0.19
      total: 291_550,
    });
  });

  it('matches the reference PDF math exactly', () => {
    // Cotización Nº 5526 with the (erroneous in real life, intended here) 10% discount applied:
    // 1 × 484.545 × 0.9 = 436.091; subtotal 436.091; IVA 82.857; total 518.948.
    const result = computeTotals([
      { precioUnitario: 484_545, cantidad: 1, descuentoPorcentaje: 10 },
    ]);
    expect(result).toEqual({ subtotal: 436_091, iva: 82_857, total: 518_948 });
  });

  it('exposes the IVA rate for UI display ("IVA (19%)")', () => {
    expect(IVA_RATE).toBe(0.19);
  });
});
