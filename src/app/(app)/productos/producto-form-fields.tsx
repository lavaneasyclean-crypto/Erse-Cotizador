'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type ProductoDefaults = {
  codigo_sku?: string;
  descripcion?: string;
  precio_neto?: number;
};

export function ProductoFormFields({
  idPrefix,
  defaults = {},
  skuEditable,
  disabled,
}: {
  idPrefix: string;
  defaults?: ProductoDefaults;
  skuEditable: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-codigo_sku`}>Código SKU *</Label>
        {/*
          Use readOnly (not disabled) when the SKU is locked. disabled inputs
          do NOT submit their value with the form — readOnly does, while still
          preventing edits. The `pointer-events-none opacity-70` keeps the
          look of a disabled field without losing the value at submit time.
        */}
        <Input
          id={`${idPrefix}-codigo_sku`}
          name="codigo_sku"
          type="text"
          defaultValue={defaults.codigo_sku ?? ''}
          required
          disabled={disabled && skuEditable}
          readOnly={!skuEditable}
          className={!skuEditable ? 'cursor-not-allowed bg-muted/40 opacity-70' : undefined}
          placeholder="0702463030CH"
        />
        {!skuEditable ? (
          <p className="text-xs text-muted-foreground">
            El código no se puede cambiar (es la llave del producto).
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-descripcion`}>Descripción *</Label>
        <Textarea
          id={`${idPrefix}-descripcion`}
          name="descripcion"
          defaultValue={defaults.descripcion ?? ''}
          rows={2}
          required
          disabled={disabled}
          placeholder="Interruptor diferencial 3P+N, 63A 30mA..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-precio_neto`}>Precio neto (CLP) *</Label>
        <Input
          id={`${idPrefix}-precio_neto`}
          name="precio_neto"
          type="number"
          min={0}
          step={1}
          defaultValue={defaults.precio_neto ?? 0}
          required
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Sin IVA. Se aplica 19% al cotizar.
        </p>
      </div>
    </div>
  );
}
