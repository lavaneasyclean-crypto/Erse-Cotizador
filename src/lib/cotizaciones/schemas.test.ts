import { describe, it, expect } from 'vitest';

import { createCotizacionSchema } from '@/lib/cotizaciones/schemas';

const validItem = {
  codigo_sku: '0702463030CH',
  descripcion: 'Interruptor diferencial 3P+N, 63A 30mA , Tipo B, NL210',
  precio_unitario: 484_545,
  cantidad: 1,
  descuento_porcentaje: 0,
};

const validInput = {
  cliente_rut: '76.526.470-7',
  vencimiento: '2 días hábiles',
  condicion_pago: 'Contado',
  notas: '',
  items: [validItem],
};

describe('createCotizacionSchema', () => {
  it('accepts a minimal valid quotation', () => {
    expect(createCotizacionSchema.safeParse(validInput).success).toBe(true);
  });

  it('requires a cliente_rut', () => {
    const result = createCotizacionSchema.safeParse({ ...validInput, cliente_rut: '' });
    expect(result.success).toBe(false);
  });

  it('requires at least one item', () => {
    const result = createCotizacionSchema.safeParse({ ...validInput, items: [] });
    expect(result.success).toBe(false);
  });

  it('rejects items with cantidad <= 0', () => {
    const bad = { ...validItem, cantidad: 0 };
    expect(createCotizacionSchema.safeParse({ ...validInput, items: [bad] }).success).toBe(false);
  });

  it('rejects items with negative price', () => {
    const bad = { ...validItem, precio_unitario: -1 };
    expect(createCotizacionSchema.safeParse({ ...validInput, items: [bad] }).success).toBe(false);
  });

  it('rejects descuento outside 0–100', () => {
    expect(
      createCotizacionSchema.safeParse({
        ...validInput,
        items: [{ ...validItem, descuento_porcentaje: 101 }],
      }).success,
    ).toBe(false);
    expect(
      createCotizacionSchema.safeParse({
        ...validInput,
        items: [{ ...validItem, descuento_porcentaje: -1 }],
      }).success,
    ).toBe(false);
  });

  it('defaults descuento_porcentaje to 0 when omitted', () => {
    const itemSinDescuento = {
      codigo_sku: validItem.codigo_sku,
      descripcion: validItem.descripcion,
      precio_unitario: validItem.precio_unitario,
      cantidad: validItem.cantidad,
    };
    const result = createCotizacionSchema.safeParse({
      ...validInput,
      items: [itemSinDescuento],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].descuento_porcentaje).toBe(0);
    }
  });

  it('coerces stringified numbers from FormData', () => {
    // The server action will receive form fields as strings. The schema must
    // accept numeric strings to avoid having to coerce by hand on every call.
    const result = createCotizacionSchema.safeParse({
      ...validInput,
      items: [
        {
          codigo_sku: '0702463030CH',
          descripcion: 'x',
          precio_unitario: '484545',
          cantidad: '1',
          descuento_porcentaje: '10',
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].precio_unitario).toBe(484_545);
      expect(result.data.items[0].descuento_porcentaje).toBe(10);
    }
  });
});
