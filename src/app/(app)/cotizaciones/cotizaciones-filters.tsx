'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ESTADOS } from '@/lib/cotizaciones/estado-schema';
import { ESTADO_CLASSES, ESTADO_LABEL } from '@/lib/cotizaciones/estado-ui';
import type { EstadoCotizacion } from '@/lib/supabase/types';

export function CotizacionesFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedEstados = (searchParams.get('estado') ?? '')
    .split(',')
    .filter((s): s is EstadoCotizacion => (ESTADOS as readonly string[]).includes(s));
  const desde = searchParams.get('desde') ?? '';
  const hasta = searchParams.get('hasta') ?? '';
  const q = searchParams.get('q') ?? '';

  // Debounce the free-text input so we don't push a URL on every keystroke.
  const [queryDraft, setQueryDraft] = React.useState(q);
  React.useEffect(() => {
    if (queryDraft === q) return;
    const timer = setTimeout(() => updateParam('q', queryDraft || null), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- updateParam is stable enough; intentional debounce
  }, [queryDraft]);

  const hasAnyFilter =
    selectedEstados.length > 0 || desde !== '' || hasta !== '' || q !== '';

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function toggleEstado(estado: EstadoCotizacion) {
    const next = selectedEstados.includes(estado)
      ? selectedEstados.filter((e) => e !== estado)
      : [...selectedEstados, estado];
    updateParam('estado', next.length > 0 ? next.join(',') : null);
  }

  function clearAll() {
    setQueryDraft('');
    router.replace(pathname, { scroll: false });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px] space-y-1">
          <Label htmlFor="cotizaciones-search" className="text-xs">
            Buscar
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="cotizaciones-search"
              type="search"
              placeholder="Número o razón social…"
              value={queryDraft}
              onChange={(e) => setQueryDraft(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="cotizaciones-desde" className="text-xs">
            Desde
          </Label>
          <Input
            id="cotizaciones-desde"
            type="date"
            value={desde}
            onChange={(e) => updateParam('desde', e.target.value || null)}
            className="w-[160px]"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="cotizaciones-hasta" className="text-xs">
            Hasta
          </Label>
          <Input
            id="cotizaciones-hasta"
            type="date"
            value={hasta}
            onChange={(e) => updateParam('hasta', e.target.value || null)}
            className="w-[160px]"
          />
        </div>

        {hasAnyFilter ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
            <X />
            Limpiar
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Estado:</span>
        {ESTADOS.map((estado) => {
          const active = selectedEstados.includes(estado);
          return (
            <button
              key={estado}
              type="button"
              onClick={() => toggleEstado(estado)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              aria-pressed={active}
            >
              <Badge
                variant="outline"
                className={cn(
                  'cursor-pointer transition-all',
                  ESTADO_CLASSES[estado],
                  active
                    ? 'ring-2 ring-current/40 shadow-sm'
                    : 'opacity-60 hover:opacity-100',
                )}
              >
                {ESTADO_LABEL[estado]}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
