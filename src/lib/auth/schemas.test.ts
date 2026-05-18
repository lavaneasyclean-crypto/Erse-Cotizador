import { describe, it, expect } from 'vitest';

import { loginSchema } from '@/lib/auth/schemas';

describe('loginSchema', () => {
  it('accepts a valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'carlos@erse.cl',
      password: 'una-contrasena-larga',
    });
    expect(result.success).toBe(true);
  });

  it('rejects malformed emails', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: '12345678' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((issue) => issue.path[0] === 'email');
      expect(emailIssue).toBeDefined();
    }
  });

  it('rejects passwords shorter than 8 characters', () => {
    // Match Supabase Auth's default minimum so we fail fast in the UI before
    // hitting the server.
    const result = loginSchema.safeParse({ email: 'carlos@erse.cl', password: '1234567' });
    expect(result.success).toBe(false);
  });

  it('trims whitespace around the email', () => {
    const result = loginSchema.safeParse({
      email: '  carlos@erse.cl  ',
      password: 'una-contrasena',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('carlos@erse.cl');
  });

  it('does not trim the password (whitespace is significant)', () => {
    const result = loginSchema.safeParse({
      email: 'carlos@erse.cl',
      password: ' tiene-espacios ',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.password).toBe(' tiene-espacios ');
  });
});
