import { describe, it, expect } from 'vitest';

import { createClienteSchema, updateClienteSchema } from '@/lib/clientes/schemas';

const baseCreate = {
  rut: '76.526.470-7',
  razon_social: 'VINA VENTISQUERO LIMITADA',
  persona: 'José Antonio Lizana',
  direccion_despacho: 'Camino Interior, Ruta G-680',
  condicion_de_pago: 'Contado',
  ciudad: 'Melipilla',
  contacto: '+56 9 7605 3088',
  email: 'jose@ventisquero.cl',
  giro: 'Viña',
};

describe('createClienteSchema', () => {
  it('accepts a fully-populated cliente', () => {
    expect(createClienteSchema.safeParse(baseCreate).success).toBe(true);
  });

  it('accepts a minimal cliente (only rut + razon_social)', () => {
    const result = createClienteSchema.safeParse({
      rut: '76.526.470-7',
      razon_social: 'VINA VENTISQUERO LIMITADA',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing rut', () => {
    expect(
      createClienteSchema.safeParse({ ...baseCreate, rut: '' }).success,
    ).toBe(false);
  });

  it('rejects missing razon_social', () => {
    expect(
      createClienteSchema.safeParse({ ...baseCreate, razon_social: '' }).success,
    ).toBe(false);
  });

  it('rejects invalid email when provided', () => {
    expect(
      createClienteSchema.safeParse({ ...baseCreate, email: 'no-arroba' }).success,
    ).toBe(false);
  });

  it('accepts empty string for email (means "no email")', () => {
    const result = createClienteSchema.safeParse({ ...baseCreate, email: '' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBeNull();
  });

  it('coerces empty optional strings to null (so DB stores NULL not empty)', () => {
    const result = createClienteSchema.safeParse({
      rut: '76.526.470-7',
      razon_social: 'X',
      persona: '',
      direccion_despacho: '',
      ciudad: '',
      contacto: '',
      email: '',
      giro: '',
      condicion_de_pago: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.persona).toBeNull();
      expect(result.data.direccion_despacho).toBeNull();
      expect(result.data.ciudad).toBeNull();
      expect(result.data.contacto).toBeNull();
      expect(result.data.email).toBeNull();
      expect(result.data.giro).toBeNull();
      expect(result.data.condicion_de_pago).toBeNull();
    }
  });

  it('trims surrounding whitespace and normalises the RUT', () => {
    // Input has dots, spaces, and lowercase letters; output is the DB-friendly
    // canonical form: no dots, single dash, uppercase K.
    const result = createClienteSchema.safeParse({
      rut: '  76.526.470-7 ',
      razon_social: '  VINA VENTISQUERO LIMITADA  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rut).toBe('76526470-7');
      expect(result.data.razon_social).toBe('VINA VENTISQUERO LIMITADA');
    }
  });

  it('rejects a RUT with the wrong check digit', () => {
    const result = createClienteSchema.safeParse({
      rut: '76.526.470-0', // valid format, invalid DV
      razon_social: 'X',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateClienteSchema', () => {
  it('accepts a valid update payload without rut (PK is immutable)', () => {
    const result = updateClienteSchema.safeParse({
      razon_social: 'NUEVO NOMBRE SPA',
      persona: 'Otro Contacto',
      direccion_despacho: '',
      condicion_de_pago: '30 días',
      ciudad: 'Santiago',
      contacto: '+56 9 1234 5678',
      email: 'nuevo@empresa.cl',
      giro: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.direccion_despacho).toBeNull();
      expect(result.data.giro).toBeNull();
    }
  });

  it('rejects empty razon_social on update', () => {
    expect(
      updateClienteSchema.safeParse({ razon_social: '   ' }).success,
    ).toBe(false);
  });

  it('rejects malformed email on update', () => {
    expect(
      updateClienteSchema.safeParse({
        razon_social: 'X',
        email: 'sin-arroba',
      }).success,
    ).toBe(false);
  });
});
