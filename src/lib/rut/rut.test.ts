import { describe, it, expect } from 'vitest';

import { computeCheckDigit, formatRut, isValidRut, normalizeRut } from '@/lib/rut/rut';

describe('computeCheckDigit', () => {
  it('computes the correct DV for known empresa RUTs', () => {
    // ERSE Electric SPA (the company that uses this app)
    expect(computeCheckDigit('77638085')).toBe('7');
    // VINA VENTISQUERO LIMITADA (from the reference cotización)
    expect(computeCheckDigit('76526470')).toBe('7');
    // A.Q.C INGENIERIA (one of the seeded clientes)
    expect(computeCheckDigit('76092011')).toBe('8');
  });

  it('computes K when the residue is 10', () => {
    expect(computeCheckDigit('17478566')).toBe('K');
  });

  it('computes 0 when the residue is 11 (sum divisible by 11)', () => {
    // 11.000.003 weighted sum = 11, exactly divisible by 11 → DV "0".
    expect(computeCheckDigit('11000003')).toBe('0');
  });
});

describe('isValidRut', () => {
  it('accepts ERSE company RUT in canonical and noisy formats', () => {
    expect(isValidRut('77.638.085-7')).toBe(true);
    expect(isValidRut('77638085-7')).toBe(true);
    expect(isValidRut('776380857')).toBe(true);
    expect(isValidRut('  77.638.085-7  ')).toBe(true);
  });

  it('accepts persona-shaped RUTs (smaller numbers, same algorithm)', () => {
    expect(isValidRut('17.478.566-K')).toBe(true);
    expect(isValidRut('17478566K')).toBe(true);
    expect(isValidRut('17478566k')).toBe(true); // lowercase k
  });

  it('rejects RUTs with wrong check digit', () => {
    expect(isValidRut('77.638.085-0')).toBe(false);
    expect(isValidRut('17.478.566-9')).toBe(false);
  });

  it('rejects empty and malformed strings', () => {
    expect(isValidRut('')).toBe(false);
    expect(isValidRut('no-es-un-rut')).toBe(false);
    expect(isValidRut('123')).toBe(false); // too short to be a real RUT
    expect(isValidRut('1234567890-1')).toBe(false); // too long
  });
});

describe('formatRut', () => {
  it('inserts dots and dash on a clean digit string', () => {
    expect(formatRut('776380857')).toBe('77.638.085-7');
    expect(formatRut('17478566K')).toBe('17.478.566-K');
  });

  it('keeps an already-formatted RUT intact', () => {
    expect(formatRut('77.638.085-7')).toBe('77.638.085-7');
  });

  it('normalizes lowercase k', () => {
    expect(formatRut('17478566k')).toBe('17.478.566-K');
  });

  it('returns the original input if it cannot be parsed', () => {
    expect(formatRut('xyz')).toBe('xyz');
  });
});

describe('normalizeRut', () => {
  it('strips dots and uppercases K, keeping the dash', () => {
    expect(normalizeRut('77.638.085-7')).toBe('77638085-7');
    expect(normalizeRut('17.478.566-K')).toBe('17478566-K');
    expect(normalizeRut('17478566k')).toBe('17478566-K');
  });
});
