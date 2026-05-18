import { describe, it, expect } from 'vitest';

import { createUserSchema, updateUserSchema } from '@/lib/auth/admin-schemas';

const baseInput = {
  email: 'carlos@erse.cl',
  password: 'una-contrasena-larga',
  nombre_completo: 'Carlos Deocares',
  is_admin: false,
};

describe('createUserSchema', () => {
  it('accepts a valid new-user payload', () => {
    expect(createUserSchema.safeParse(baseInput).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(createUserSchema.safeParse({ ...baseInput, email: 'no-arroba' }).success).toBe(false);
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(createUserSchema.safeParse({ ...baseInput, password: '1234567' }).success).toBe(false);
  });

  it('rejects empty nombre_completo', () => {
    expect(createUserSchema.safeParse({ ...baseInput, nombre_completo: '   ' }).success).toBe(
      false,
    );
  });

  it('coerces the is_admin checkbox value "on" to true', () => {
    // HTML checkboxes submit `"on"` when checked, nothing when unchecked.
    const result = createUserSchema.safeParse({ ...baseInput, is_admin: 'on' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.is_admin).toBe(true);
  });

  it('treats missing is_admin as false', () => {
    const result = createUserSchema.safeParse({
      email: baseInput.email,
      password: baseInput.password,
      nombre_completo: baseInput.nombre_completo,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.is_admin).toBe(false);
  });

  it('trims surrounding whitespace on email and name', () => {
    const result = createUserSchema.safeParse({
      ...baseInput,
      email: '  carlos@erse.cl ',
      nombre_completo: '  Carlos  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('carlos@erse.cl');
      expect(result.data.nombre_completo).toBe('Carlos');
    }
  });
});

describe('updateUserSchema', () => {
  const baseUpdate = {
    nombre_completo: 'Carlos Deocares',
    is_admin: false,
    password: '',
  };

  it('accepts a minimal valid update (no password change)', () => {
    expect(updateUserSchema.safeParse(baseUpdate).success).toBe(true);
  });

  it('accepts a valid password change', () => {
    const result = updateUserSchema.safeParse({ ...baseUpdate, password: 'una-nueva-clave' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.password).toBe('una-nueva-clave');
  });

  it('treats empty password as "do not change"', () => {
    const result = updateUserSchema.safeParse(baseUpdate);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.password).toBeUndefined();
  });

  it('rejects new passwords shorter than 8 characters', () => {
    expect(
      updateUserSchema.safeParse({ ...baseUpdate, password: '1234567' }).success,
    ).toBe(false);
  });

  it('rejects empty nombre_completo', () => {
    expect(
      updateUserSchema.safeParse({ ...baseUpdate, nombre_completo: '   ' }).success,
    ).toBe(false);
  });

  it('coerces is_admin "on" to true', () => {
    const result = updateUserSchema.safeParse({ ...baseUpdate, is_admin: 'on' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.is_admin).toBe(true);
  });
});
