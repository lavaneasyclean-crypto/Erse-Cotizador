# ADR 003 — Discount visibility (platform shows it, customer-facing PDF hides it)

## Context

Each line in a cotización has a `descuento_porcentaje` (0–100). Vendors use it during pricing negotiations. The reference PDF (`Cotizacion_5526_…`) printed the gross unit price in `PRECIO` and the post-discount amount in `TOTAL`, so `PRECIO × Cantidad ≠ TOTAL` — the discount was visible to the customer by simple arithmetic, which is awkward when the discount is a courtesy and not a posted promotion.

The vendor (operating the platform) still needs to see and edit per-line discounts and a global discount, because that's how pricing decisions are made internally.

## Decision

Split discount visibility by audience:

- **Customer-facing PDF (`/cotizaciones/[id]/pdf`)**: the discount is invisible. The `PRECIO` column renders the **net unit price** (`round(precio_neto × (1 - descuento/100))`), so `PRECIO × Cantidad = TOTAL` reads cleanly. There is no discount column.
- **Internal platform (`/cotizaciones/[id]` detail page)**: gross `PRECIO`, an explicit `Dcto %` column, and the `TOTAL` net. A footnote reminds the vendor that the discount column doesn't appear on the printed PDF.
- **New / Edit form**: the vendor edits `Dcto %` per line and can also enter a global percentage and click "Aplicar a todos" to fan it out to every line in one click. After applying, each line's discount remains independently editable.

To keep platform totals and PDF totals in lockstep, `lib/cotizaciones/totals.ts` rounds at the unit level first:

```ts
unitNet(line) = round(precio × (1 - dcto/100))
lineTotal(line) = round(unitNet(line) × cantidad)
```

This is shared between platform UI and PDF rendering. The reference math case (`484.545 × 1 × 0.9 = 436.091`) is unaffected because `cantidad = 1`. For `cantidad > 1` with rounding-prone discounts the unit-first rounding ensures `PRECIO × Cantidad = TOTAL` on the PDF, which the customer can verify by hand.

## Consequences

- A single source of truth for line math: both the PDF and the platform call `unitNet` and `lineTotal` from `lib/cotizaciones/totals.ts`. Drift between the two becomes impossible.
- Vendors keep a clear internal view of their margin (Dcto% column visible on the detail page) while customers only see the negotiated price.
- The global-discount button is intentionally **not** stored on the cotización — it is a UI affordance only. Two quotes with all lines at 10% are indistinguishable from a quote where each was set to 10% individually. This keeps the schema flat and avoids a "header discount vs line discount" ambiguity.
- Rounding can differ by 1 CLP from "compute precisely then round once" math in pathological cases. We accept this because matching the printed PDF row-by-row is more important than the last-CLP fidelity that no customer will notice.

## Alternatives considered

- **Keep the legacy behaviour (show gross PRECIO, show post-discount TOTAL).** Customers can infer the discount from the math, which the team treats as awkward. Rejected.
- **Add a "discount" column to the PDF.** Most transparent but also negotiating leverage they don't want to advertise. Rejected.
- **Store the global discount on `cotizaciones`.** Tempting, but creates two ways to express the same outcome (header dcto vs sum of line dctos) and forces a precedence rule. The button-driven fan-out keeps the data model single-purpose. Rejected.
- **Round only at the end (current historical behaviour of `lineTotal`).** Produces PDF rows where `PRECIO × Cantidad` may differ from `TOTAL` by 1 — visible inconsistency for the customer. Rejected.
