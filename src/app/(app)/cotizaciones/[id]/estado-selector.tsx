'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ESTADOS } from '@/lib/cotizaciones/estado-schema';
import type { EstadoCotizacion } from '@/lib/supabase/types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { updateEstadoAction, type UpdateEstadoResult } from './actions';

const ESTADO_LABEL: Record<EstadoCotizacion, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

const ESTADO_CLASSES: Record<EstadoCotizacion, string> = {
  borrador:
    'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300',
  enviada:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300',
  aprobada:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  rechazada:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
};

const initialState: UpdateEstadoResult = {};

export function EstadoSelector({
  cotizacionId,
  current,
  canEdit,
}: {
  cotizacionId: string;
  current: EstadoCotizacion;
  canEdit: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, isPending] = useActionState(updateEstadoAction, initialState);
  const formRef = React.useRef<HTMLFormElement>(null);
  const estadoInputRef = React.useRef<HTMLInputElement>(null);

  // Close popover after a successful change. The Server Component re-renders
  // with the new `current` thanks to revalidatePath, so we don't need local
  // optimistic state. setState-in-effect is intentional here: we're reacting
  // to an external event (the server action result) that arrives after render.
  React.useEffect(() => {
    if (!state.success) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close on server-action success
    setOpen(false);
  }, [state.success]);

  function handleSelect(next: EstadoCotizacion) {
    if (next === current) {
      setOpen(false);
      return;
    }
    if (estadoInputRef.current) estadoInputRef.current.value = next;
    formRef.current?.requestSubmit();
  }

  // Non-vendors just see the badge.
  if (!canEdit) {
    return (
      <Badge variant="outline" className={ESTADO_CLASSES[current]}>
        {ESTADO_LABEL[current]}
      </Badge>
    );
  }

  return (
    <>
      <form action={formAction} ref={formRef} className="hidden">
        <input type="hidden" name="cotizacion_id" value={cotizacionId} />
        <input ref={estadoInputRef} type="hidden" name="estado" defaultValue={current} />
      </form>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              disabled={isPending}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              title="Click para cambiar estado"
              aria-label="Cambiar estado de la cotización"
            >
              <Badge
                variant="outline"
                className={cn(
                  ESTADO_CLASSES[current],
                  'cursor-pointer gap-1 transition-all hover:shadow-sm hover:ring-1 hover:ring-current/30',
                )}
              >
                {isPending ? 'Guardando…' : ESTADO_LABEL[current]}
                {!isPending ? <ChevronDown className="size-3 opacity-70" /> : null}
              </Badge>
            </button>
          }
        />
        <PopoverContent align="end" className="w-56 p-1">
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Cambiar estado a:
          </p>
          <div className="space-y-1">
            {ESTADOS.map((estado) => (
              <button
                key={estado}
                type="button"
                onClick={() => handleSelect(estado)}
                disabled={isPending}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-50',
                  estado === current && 'bg-muted/60',
                )}
              >
                <Badge
                  variant="outline"
                  className={cn(ESTADO_CLASSES[estado], 'pointer-events-none')}
                >
                  {ESTADO_LABEL[estado]}
                </Badge>
                {estado === current ? (
                  <Check className="ml-auto size-4 text-muted-foreground" />
                ) : null}
              </button>
            ))}
          </div>
          {state.error ? (
            <p className="mt-2 px-2 text-xs text-rose-600">{state.error}</p>
          ) : null}
        </PopoverContent>
      </Popover>
    </>
  );
}
