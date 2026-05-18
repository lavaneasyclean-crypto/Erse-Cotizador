import { describe, it, expect } from 'vitest';

import { updateProfileSchema } from '@/lib/auth/profile-schemas';

describe('updateProfileSchema', () => {
  it('accepts a normal name', () => {
    const result = updateProfileSchema.safeParse({ nombre_completo: 'Carlos Deocares' });
    expect(result.success).toBe(true);
  });

  it('trims surrounding whitespace', () => {
    const result = updateProfileSchema.safeParse({ nombre_completo: '  Carlos Deocares  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.nombre_completo).toBe('Carlos Deocares');
  });

  it('rejects an empty name', () => {
    const result = updateProfileSchema.safeParse({ nombre_completo: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a whitespace-only name', () => {
    const result = updateProfileSchema.safeParse({ nombre_completo: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects names longer than 80 characters', () => {
    const longName = 'a'.repeat(81);
    const result = updateProfileSchema.safeParse({ nombre_completo: longName });
    expect(result.success).toBe(false);
  });

  it('accepts names up to 80 characters', () => {
    const okName = 'a'.repeat(80);
    expect(updateProfileSchema.safeParse({ nombre_completo: okName }).success).toBe(true);
  });

  it('preserves internal spaces and accented characters', () => {
    const result = updateProfileSchema.safeParse({ nombre_completo: 'José Ñandú de la Peña' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.nombre_completo).toBe('José Ñandú de la Peña');
  });
});
