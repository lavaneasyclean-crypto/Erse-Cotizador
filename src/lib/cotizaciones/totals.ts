/**
 * Chilean IVA rate applied to quotations. Exposed so the UI can render
 * "IVA (19%)" without re-declaring the constant.
 */
export const IVA_RATE = 0.19;

export type QuoteLine = {
  precioUnitario: number;
  cantidad: number;
  /** 0–100. Stored as a percentage on the line, not a fraction. */
  descuentoPorcentaje: number;
};

export type QuoteTotals = {
  subtotal: number;
  iva: number;
  total: number;
};

function assertValidLine(line: QuoteLine): void {
  if (line.cantidad <= 0) {
    throw new Error('cantidad debe ser mayor a 0');
  }
  if (line.precioUnitario < 0) {
    throw new Error('precio unitario no puede ser negativo');
  }
  if (line.descuentoPorcentaje < 0 || line.descuentoPorcentaje > 100) {
    throw new Error('descuento debe estar entre 0 y 100');
  }
}

// CLP has no decimals, so every monetary value is rounded to the nearest
// integer using half-up (Math.round). Anchored to the reference PDF.
function roundCLP(value: number): number {
  return Math.round(value);
}

/**
 * Per-unit price after discount, rounded to CLP. This is the value the PDF
 * shows in the PRECIO column to hide the discount from the customer — by
 * always rendering the net unit, `PRECIO × Cantidad = TOTAL` works cleanly.
 */
export function unitNet(line: Pick<QuoteLine, 'precioUnitario' | 'descuentoPorcentaje'>): number {
  if (line.precioUnitario < 0) {
    throw new Error('precio unitario no puede ser negativo');
  }
  if (line.descuentoPorcentaje < 0 || line.descuentoPorcentaje > 100) {
    throw new Error('descuento debe estar entre 0 y 100');
  }
  return roundCLP(line.precioUnitario * (1 - line.descuentoPorcentaje / 100));
}

export function lineTotal(line: QuoteLine): number {
  assertValidLine(line);
  // Round the unit first so that the PDF's PRECIO × Cantidad equals TOTAL
  // exactly — see docs/ADR/003-discount-visibility.md.
  return roundCLP(unitNet(line) * line.cantidad);
}

export function computeTotals(lines: QuoteLine[]): QuoteTotals {
  const subtotal = lines.reduce((acc, line) => acc + lineTotal(line), 0);
  const iva = roundCLP(subtotal * IVA_RATE);
  const total = subtotal + iva;
  return { subtotal, iva, total };
}
