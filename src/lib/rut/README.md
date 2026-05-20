# lib/rut

Helpers for Chilean RUT validation and formatting. Works for personas
naturales and personas jurídicas — same algorithm, same code path.

See [ADR 006](../../../docs/ADR/006-rut-validation.md) for the full
rationale.

## API

```ts
import {
  computeCheckDigit,
  isValidRut,
  formatRut,
  normalizeRut,
} from '@/lib/rut/rut';

computeCheckDigit('77638085'); // → '7'
isValidRut('77.638.085-7');    // → true
isValidRut('77.638.085-0');    // → false (bad DV)
formatRut('776380857');        // → '77.638.085-7'   (pretty, for display)
normalizeRut('77.638.085-7');  // → '77638085-7'     (canonical, for storage)
```

## Convention

- **DB stores `normalizeRut()` form** (no dots, dash, uppercase K).
- **UI displays via `formatRut()`** (with dots).
- **`createClienteSchema` validates and normalises** before insert, so
  every persisted RUT is canonical.

## Tests

`rut.test.ts` covers the algorithm with real company RUTs (ERSE, Viña
Ventisquero, A.Q.C Ingeniería), the K-residue case, the zero-residue
case, malformed inputs, and the normalisation round-trip.
