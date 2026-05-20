import { describe, it, expect } from 'vitest';

import { createProductoSchema, updateProductoSchema } from '@/lib/productos/schemas';

const base = {
  codigo_sku: '0702463030CH',
  descripcion: 'Interruptor diferencial 3P+N, 63A 30mA, Tipo B, NL210',
  precio_neto: 484_545,
};

describe('createProductoSchema', () => {
  it('accepts a valid producto', () => {
    expect(createProductoSchema.safeParse(base).success).toBe(true);
  });

  it('rejects empty codigo_sku', () => {
    expect(createProductoSchema.safeParse({ ...base, codigo_sku: '' }).success).toBe(false);
  });

  it('rejects empty descripcion', () => {
    expect(createProductoSchema.safeParse({ ...base, descripcion: '   ' }).success).toBe(false);
  });

  it('rejects negative precio_neto', () => {
    expect(createProductoSchema.safeParse({ ...base, precio_neto: -1 }).success).toBe(false);
  });

  it('accepts precio_neto = 0 (free / promotional items)', () => {
    expect(createProductoSchema.safeParse({ ...base, precio_neto: 0 }).success).toBe(true);
  });

  it('coerces string precio from FormData to number', () => {
    const result = createProductoSchema.safeParse({ ...base, precio_neto: '484545' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.precio_neto).toBe(484_545);
  });

  it('rounds precio_neto to nearest CLP (no decimals on prices)', () => {
    const result = createProductoSchema.safeParse({ ...base, precio_neto: 1234.6 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.precio_neto).toBe(1_235);
  });

  it('trims surrounding whitespace on text fields', () => {
    const result = createProductoSchema.safeParse({
      codigo_sku: '  ABC123  ',
      descripcion: '  Cable rojo  ',
      precio_neto: 1000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.codigo_sku).toBe('ABC123');
      expect(result.data.descripcion).toBe('Cable rojo');
    }
  });
});

describe('updateProductoSchema', () => {
  it('accepts update without codigo_sku (PK is immutable)', () => {
    const result = updateProductoSchema.safeParse({
      descripcion: 'Nueva descripción',
      precio_neto: 2000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty descripcion on update', () => {
    expect(
      updateProductoSchema.safeParse({ descripcion: '', precio_neto: 1000 }).success,
    ).toBe(false);
  });

  it('rejects negative precio on update', () => {
    expect(
      updateProductoSchema.safeParse({ descripcion: 'X', precio_neto: -1 }).success,
    ).toBe(false);
  });
});
