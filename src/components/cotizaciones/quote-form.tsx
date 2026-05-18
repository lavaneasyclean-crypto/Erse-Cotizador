'use client';

import * as React from 'react';
import Link from 'next/link';
import { useActionState } from 'react';
import { Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { IVA_RATE, computeTotals, lineTotal } from '@/lib/cotizaciones/totals';
import { formatCLP } from '@/lib/format/format';

export type QuoteFormState = { error: string } | undefined;
export type QuoteFormAction = (
  state: QuoteFormState,
  formData: FormData,
) => Promise<QuoteFormState>;

export type Cliente = {
  rut: string;
  razon_social: string;
  condicion_de_pago: string | null;
};

export type Producto = {
  codigo_sku: string;
  descripcion: string;
  precio_neto: number;
};

export type ItemRow = {
  codigo_sku: string;
  descripcion: string;
  precio_unitario: number;
  cantidad: number;
  descuento_porcentaje: number;
};

export type QuoteFormInitial = {
  cliente_rut: string;
  vencimiento: string;
  condicion_pago: string;
  notas: string;
  items: ItemRow[];
};

const EMPTY_ITEM: ItemRow = {
  codigo_sku: '',
  descripcion: '',
  precio_unitario: 0,
  cantidad: 1,
  descuento_porcentaje: 0,
};

const DEFAULT_INITIAL: QuoteFormInitial = {
  cliente_rut: '',
  vencimiento: '2 días hábiles',
  condicion_pago: 'Contado',
  notas: '',
  items: [EMPTY_ITEM],
};

export function QuoteForm({
  clientes,
  productos,
  action,
  submitLabel,
  initial = DEFAULT_INITIAL,
  cotizacionId,
}: {
  clientes: Cliente[];
  productos: Producto[];
  action: QuoteFormAction;
  submitLabel: string;
  initial?: QuoteFormInitial;
  cotizacionId?: string;
}) {
  const [state, formAction, isPending] = useActionState<QuoteFormState, FormData>(
    action,
    undefined,
  );

  const [clienteRut, setClienteRut] = React.useState<string>(initial.cliente_rut);
  const [vencimiento, setVencimiento] = React.useState<string>(initial.vencimiento);
  const [condicionPago, setCondicionPago] = React.useState<string>(initial.condicion_pago);
  const [notas, setNotas] = React.useState<string>(initial.notas);
  const [items, setItems] = React.useState<ItemRow[]>(
    initial.items.length > 0 ? initial.items : [EMPTY_ITEM],
  );
  const [globalDcto, setGlobalDcto] = React.useState<number>(0);

  function handleClienteChange(rut: string) {
    setClienteRut(rut);
    const cliente = clientes.find((c) => c.rut === rut);
    if (cliente?.condicion_de_pago) {
      setCondicionPago(cliente.condicion_de_pago);
    }
  }

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, EMPTY_ITEM]);
  }

  function removeItem(index: number) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  // Apply the same discount to every item; per-line dcto remains editable afterwards.
  function applyGlobalDiscount() {
    setItems((prev) => prev.map((item) => ({ ...item, descuento_porcentaje: globalDcto })));
  }

  const totals = computeTotals(
    items
      .filter((item) => item.codigo_sku !== '')
      .map((item) => ({
        precioUnitario: item.precio_unitario,
        cantidad: item.cantidad,
        descuentoPorcentaje: item.descuento_porcentaje,
      })),
  );

  const filledItems = items.filter((item) => item.codigo_sku !== '');
  const canSubmit = clienteRut !== '' && filledItems.length > 0 && !isPending;

  return (
    <form action={formAction} className="space-y-6">
      {cotizacionId ? (
        <input type="hidden" name="cotizacion_id" value={cotizacionId} />
      ) : null}
      <input type="hidden" name="cliente_rut" value={clienteRut} />
      <input type="hidden" name="vencimiento" value={vencimiento} />
      <input type="hidden" name="condicion_pago" value={condicionPago} />
      <input type="hidden" name="notas" value={notas} />
      <input type="hidden" name="items" value={JSON.stringify(filledItems)} />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Cliente</Label>
          <ClientePicker
            clientes={clientes}
            value={clienteRut}
            onChange={handleClienteChange}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="condicion_pago_input">Condición de pago</Label>
          <Input
            id="condicion_pago_input"
            value={condicionPago}
            onChange={(e) => setCondicionPago(e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vencimiento_input">Vencimiento</Label>
          <Input
            id="vencimiento_input"
            value={vencimiento}
            onChange={(e) => setVencimiento(e.target.value)}
            disabled={isPending}
          />
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-medium">Items</h2>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="global_dcto_input" className="text-xs text-muted-foreground">
                Dcto global %
              </Label>
              <Input
                id="global_dcto_input"
                type="number"
                min={0}
                max={100}
                step="any"
                value={globalDcto}
                onChange={(e) => setGlobalDcto(Number(e.target.value))}
                className="w-24"
                disabled={isPending}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyGlobalDiscount}
              disabled={isPending}
              title="Aplica el % a todas las líneas. Cada una sigue editable."
            >
              Aplicar a todos
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              disabled={isPending}
            >
              <Plus />
              Agregar item
            </Button>
          </div>
        </header>

        <div className="space-y-3">
          {items.map((item, index) => (
            <ItemEditor
              key={index}
              index={index}
              item={item}
              productos={productos}
              onChange={(patch) => updateItem(index, patch)}
              onRemove={() => removeItem(index)}
              canRemove={items.length > 1}
              disabled={isPending}
            />
          ))}
        </div>
      </section>

      <Separator />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="notas_input">Notas / observaciones</Label>
          <Textarea
            id="notas_input"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={4}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">${formatCLP(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">IVA ({Math.round(IVA_RATE * 100)}%)</span>
              <span className="font-mono">${formatCLP(totals.iva)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between py-1 text-base font-semibold">
              <span>Total</span>
              <span className="font-mono">${formatCLP(totals.total)}</span>
            </div>
          </div>
        </div>
      </section>

      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <Link
          href={cotizacionId ? `/cotizaciones/${cotizacionId}` : '/cotizaciones'}
          className={buttonVariants({ variant: 'outline' })}
        >
          Cancelar
        </Link>
        <Button type="submit" disabled={!canSubmit}>
          {isPending ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function ClientePicker({
  clientes,
  value,
  onChange,
  disabled,
}: {
  clientes: Cliente[];
  value: string;
  onChange: (rut: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = clientes.find((c) => c.rut === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50',
          !selected && 'text-muted-foreground',
        )}
        disabled={disabled}
      >
        <span className="truncate">
          {selected ? `${selected.razon_social} — ${selected.rut}` : 'Buscar cliente…'}
        </span>
        <ChevronsUpDown className="size-4 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por razón social o RUT…" />
          <CommandList>
            <CommandEmpty>No se encontraron clientes.</CommandEmpty>
            <CommandGroup>
              {clientes.map((cliente) => (
                <CommandItem
                  key={cliente.rut}
                  value={`${cliente.razon_social} ${cliente.rut}`}
                  onSelect={() => {
                    onChange(cliente.rut);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 size-4',
                      cliente.rut === value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="flex-1 truncate">{cliente.razon_social}</span>
                  <span className="text-xs text-muted-foreground">{cliente.rut}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ItemEditor({
  index,
  item,
  productos,
  onChange,
  onRemove,
  canRemove,
  disabled,
}: {
  index: number;
  item: ItemRow;
  productos: Producto[];
  onChange: (patch: Partial<ItemRow>) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
}) {
  const total = item.codigo_sku
    ? lineTotal({
        precioUnitario: item.precio_unitario,
        cantidad: item.cantidad,
        descuentoPorcentaje: item.descuento_porcentaje,
      })
    : 0;

  return (
    <div className="grid grid-cols-12 gap-3 rounded-lg border border-border bg-card p-3">
      <div className="col-span-12 flex items-center gap-2 md:col-span-6">
        <span className="text-sm font-mono text-muted-foreground">#{index + 1}</span>
        <div className="flex-1">
          <ProductoPicker
            productos={productos}
            value={item.codigo_sku}
            onSelect={(producto) =>
              onChange({
                codigo_sku: producto.codigo_sku,
                descripcion: producto.descripcion,
                precio_unitario: producto.precio_neto,
              })
            }
            disabled={disabled}
          />
        </div>
      </div>

      <div className="col-span-4 md:col-span-2">
        <Label className="text-xs text-muted-foreground">Cantidad</Label>
        <Input
          type="number"
          min={0}
          step="any"
          value={item.cantidad}
          onChange={(e) => onChange({ cantidad: Number(e.target.value) })}
          disabled={disabled}
        />
      </div>

      <div className="col-span-4 md:col-span-2">
        <Label className="text-xs text-muted-foreground">Dcto %</Label>
        <Input
          type="number"
          min={0}
          max={100}
          step="any"
          value={item.descuento_porcentaje}
          onChange={(e) => onChange({ descuento_porcentaje: Number(e.target.value) })}
          disabled={disabled}
        />
      </div>

      <div className="col-span-4 flex flex-col justify-end text-right md:col-span-2">
        <Label className="text-xs text-muted-foreground">Total</Label>
        <div className="flex h-9 items-center justify-end gap-2 font-mono">
          <span>${formatCLP(total)}</span>
          {canRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onRemove}
              disabled={disabled}
              aria-label="Quitar item"
            >
              <Trash2 />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProductoPicker({
  productos,
  value,
  onSelect,
  disabled,
}: {
  productos: Producto[];
  value: string;
  onSelect: (producto: Producto) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = productos.find((p) => p.codigo_sku === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50',
          !selected && 'text-muted-foreground',
        )}
        disabled={disabled}
      >
        <span className="truncate">
          {selected ? `${selected.codigo_sku} — ${selected.descripcion}` : 'Buscar producto…'}
        </span>
        <ChevronsUpDown className="size-4 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Código o descripción…" />
          <CommandList>
            <CommandEmpty>No se encontraron productos.</CommandEmpty>
            <CommandGroup>
              {productos.map((producto) => (
                <CommandItem
                  key={producto.codigo_sku}
                  value={`${producto.codigo_sku} ${producto.descripcion}`}
                  onSelect={() => {
                    onSelect(producto);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 size-4',
                      producto.codigo_sku === value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <div className="flex flex-1 flex-col">
                    <span className="font-mono text-xs text-muted-foreground">
                      {producto.codigo_sku}
                    </span>
                    <span className="truncate">{producto.descripcion}</span>
                  </div>
                  <span className="ml-2 font-mono text-xs">${formatCLP(producto.precio_neto)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
