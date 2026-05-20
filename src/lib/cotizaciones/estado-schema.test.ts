import { describe, it, expect } from 'vitest';

import { updateEstadoSchema, ESTADOS } from '@/lib/cotizaciones/estado-schema';

describe('ESTADOS', () => {
  it('lists the four states in workflow order', () => {
    // Order matters for the UI dropdown — borrador → enviada → aprobada/rechazada.
    expect(ESTADOS).toEqual(['borrador', 'enviada', 'aprobada', 'rechazada']);
  });
});

describe('updateEstadoSchema', () => {
  it('accepts a valid id + valid estado', () => {
    const result = updateEstadoSchema.safeParse({
      cotizacion_id: '9f0340b1-9c0f-4982-99ab-8ba42c2f7a47',
      estado: 'enviada',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown estado', () => {
    expect(
      updateEstadoSchema.safeParse({
        cotizacion_id: '9f0340b1-9c0f-4982-99ab-8ba42c2f7a47',
        estado: 'cancelada',
      }).success,
    ).toBe(false);
  });

  it('rejects a non-UUID id', () => {
    expect(
      updateEstadoSchema.safeParse({
        cotizacion_id: 'not-a-uuid',
        estado: 'enviada',
      }).success,
    ).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(
      updateEstadoSchema.safeParse({ estado: 'enviada' }).success,
    ).toBe(false);
    expect(
      updateEstadoSchema.safeParse({
        cotizacion_id: '9f0340b1-9c0f-4982-99ab-8ba42c2f7a47',
      }).success,
    ).toBe(false);
  });
});
