'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type ClienteDefaults = {
  rut?: string;
  razon_social?: string;
  persona?: string | null;
  direccion_despacho?: string | null;
  condicion_de_pago?: string | null;
  ciudad?: string | null;
  contacto?: string | null;
  email?: string | null;
  giro?: string | null;
};

/**
 * Shared form body used by both the New and Edit cliente dialogs.
 * `rutEditable` controls whether the RUT input is editable (true for create,
 * false for edit — the RUT is the primary key and FK target).
 */
export function ClienteFormFields({
  idPrefix,
  defaults = {},
  rutEditable,
  disabled,
}: {
  idPrefix: string;
  defaults?: ClienteDefaults;
  rutEditable: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-rut`}>RUT *</Label>
        {/*
          Use readOnly (not disabled) when the RUT is locked. disabled inputs
          do NOT submit their value, so the update action wouldn't know which
          row to target.
        */}
        <Input
          id={`${idPrefix}-rut`}
          name="rut"
          type="text"
          defaultValue={defaults.rut ?? ''}
          required
          disabled={disabled && rutEditable}
          readOnly={!rutEditable}
          className={!rutEditable ? 'cursor-not-allowed bg-muted/40 opacity-70' : undefined}
          placeholder="77.638.085-7"
        />
        {!rutEditable ? (
          <p className="text-xs text-muted-foreground">
            El RUT no se puede cambiar (es la llave del cliente).
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-razon_social`}>Razón social *</Label>
        <Input
          id={`${idPrefix}-razon_social`}
          name="razon_social"
          type="text"
          defaultValue={defaults.razon_social ?? ''}
          required
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-persona`}>Contacto (persona)</Label>
        <Input
          id={`${idPrefix}-persona`}
          name="persona"
          type="text"
          defaultValue={defaults.persona ?? ''}
          disabled={disabled}
          placeholder="Nombre del contacto"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-contacto`}>Teléfono</Label>
        <Input
          id={`${idPrefix}-contacto`}
          name="contacto"
          type="text"
          defaultValue={defaults.contacto ?? ''}
          disabled={disabled}
          placeholder="+56 9 1234 5678"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-email`}>Email</Label>
        <Input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          defaultValue={defaults.email ?? ''}
          disabled={disabled}
          placeholder="cliente@empresa.cl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-ciudad`}>Ciudad</Label>
        <Input
          id={`${idPrefix}-ciudad`}
          name="ciudad"
          type="text"
          defaultValue={defaults.ciudad ?? ''}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`${idPrefix}-direccion_despacho`}>Dirección de despacho</Label>
        <Textarea
          id={`${idPrefix}-direccion_despacho`}
          name="direccion_despacho"
          defaultValue={defaults.direccion_despacho ?? ''}
          rows={2}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-condicion_de_pago`}>Condición de pago</Label>
        <Input
          id={`${idPrefix}-condicion_de_pago`}
          name="condicion_de_pago"
          type="text"
          defaultValue={defaults.condicion_de_pago ?? ''}
          disabled={disabled}
          placeholder="Contado, 30 días, etc."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-giro`}>Giro</Label>
        <Input
          id={`${idPrefix}-giro`}
          name="giro"
          type="text"
          defaultValue={defaults.giro ?? ''}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
