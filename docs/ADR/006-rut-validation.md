# ADR 006 — Chilean RUT validation and storage format

## Context

`clientes.rut` is the primary key of the clientes table and the foreign
key target from `cotizaciones.cliente_rut`. Until now we accepted any
string the vendor typed. With ~1,500 clientes already in the database we
saw entries like `76070142- 4` (with a stray space), `12345678` (missing
the check digit), and varied use of dots — making lookups brittle and
duplicates likely (one cliente could end up under both `12.345.678-9` and
`12345678-9`).

The user asked for the same check applied to both personas naturales and
personas jurídicas — which in Chile use the same RUT format and the same
check-digit algorithm.

## Decision

### Single canonical format in the database

The DB stores every RUT in the dotless, dashed, uppercase-K form:

```
77638085-7        ← OK
77.638.085-7      ← input gets normalised before insert
12345678          ← rejected: missing check digit
17478566K         ← input gets normalised to 17478566-K
17478566k         ← lowercase k normalised to uppercase
```

Normalisation happens in `lib/rut/rut.ts`'s `normalizeRut()` and runs
inside the Zod transform of `createClienteSchema.rut`, so any insert path
(form, server action, future API) produces canonical values.

### Validation via modulo-11

`computeCheckDigit(body)` implements the standard Chilean algorithm:

1. Reverse the body digits.
2. Multiply each by the cycle `2, 3, 4, 5, 6, 7` (repeating).
3. Sum the products.
4. `residue = 11 - (sum mod 11)`.
5. `residue === 11` → DV `'0'`; `residue === 10` → DV `'K'`; otherwise
   `String(residue)`.

`isValidRut(raw)` parses the input, requires 7–8 digit body + 0/K check
digit, and compares the computed DV with the input DV. The same function
covers personas (typically <30M body) and empresas (50M–99M body) — only
the numeric range differs, not the algorithm.

### Auto-format on blur, not on every keystroke

The cliente form input has `onBlur={(e) => e.target.value = formatRut(...)}`
in `ClienteFormFields`. We deliberately do **not** format on each
keystroke because:

- Tracking the cursor through inserted dots/dashes is finicky and
  jittery.
- The server-side schema normalises again, so the DB stays consistent
  even if the input value isn't perfectly formatted at submit time.
- Vendors who paste a RUT from an external system see it cleaned up the
  moment they tab away.

## Consequences

- New clientes always store the canonical RUT. Old rows are untouched
  (no retroactive migration); we accept they may have ragged formatting
  until someone edits them.
- Cotizaciones referencing `cliente_rut` continue to work — the FK only
  cares about exact string equality, and we don't change existing rows.
- Errors at insert time are explicit: `"RUT inválido (verifica el dígito
  verificador)"` instead of a silent DB constraint violation.
- 18 unit tests in `src/lib/rut/rut.test.ts` lock the algorithm behaviour
  including the K-residue case and the zero-residue case.

## Alternatives considered

- **Store the RUT exactly as the user typed it.** What we had. Causes
  duplicates and breaks joins. Rejected.
- **Format with dots in storage (`77.638.085-7`).** More readable when
  inspecting the DB directly, but every join/comparison has to deal with
  optional dots. The dotless form is canonical in most Chilean APIs
  (SII, Servipag, etc.). Rejected.
- **Validate only client-side.** Faster but a malicious request to the
  server action could still insert garbage. Rejected — schema validates
  in both places.
- **Use an existing library (`@validatecl/rut`, `rut.js`).** Adds a
  dependency for ~40 lines of pure algorithm. Rejected; we own the code
  and the tests.
