# lib/cotizaciones

Pure-logic core of the quotations feature. No I/O lives here — these
modules are imported by Server Actions, Server Components, the PDF
renderer, and the test runner alike.

## Modules

| File | Responsibility |
|------|----------------|
| `totals.ts` | `unitNet`, `lineTotal`, `computeTotals`, `IVA_RATE`. The single source of truth for quotation math; used by the form preview, the detail view, and the PDF. See [ADR 003](../../../docs/ADR/003-discount-visibility.md). |
| `schemas.ts` | `createCotizacionSchema` — Zod schema used by the server action when inserting a cotización + items. Coerces string FormData inputs to numbers. |
| `estado-schema.ts` | `ESTADOS` tuple (`borrador → enviada → aprobada → rechazada`) and `updateEstadoSchema`. Source of truth for the four allowed states; the EstadoSelector and the server action both read from here. |

## Math invariant

All UI surfaces that show a price use the same helper so the platform
and the PDF never disagree:

```
unitNet  = round(precio_neto × (1 − descuento/100))   // CLP, integer
lineTotal = round(unitNet × cantidad)
subtotal = Σ lineTotal
iva      = round(subtotal × 0.19)
total    = subtotal + iva
```

Rounding happens at the unit step first so the PDF's `PRECIO × Cantidad
= TOTAL` reads cleanly to the customer (see ADR 003).

## Tests

`totals.test.ts` locks the math against the reference PDF
(Nº 5526: 484.545 × 1 × 0.9 = 436.091, IVA 82.857, total 518.948) and
covers the rounding-prone `cantidad > 1` cases. `schemas.test.ts`
covers FormData coercion + validation edges. `estado-schema.test.ts`
locks the workflow order.
