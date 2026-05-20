'use client';

import * as React from 'react';

import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { EditClienteButton } from './edit-cliente-button';

export type ClienteRow = {
  rut: string;
  razon_social: string;
  persona: string | null;
  direccion_despacho: string | null;
  condicion_de_pago: string | null;
  ciudad: string | null;
  contacto: string | null;
  email: string | null;
  giro: string | null;
};

type ColumnKey = 'razon_social' | 'rut' | 'contacto' | 'ciudad' | 'acciones';

const COLUMNS: { key: ColumnKey; label: string; default: number; min: number; align?: 'right' }[] = [
  { key: 'razon_social', label: 'Razón social', default: 300, min: 140 },
  { key: 'rut', label: 'RUT', default: 110, min: 90 },
  { key: 'contacto', label: 'Contacto', default: 200, min: 120 },
  { key: 'ciudad', label: 'Ciudad', default: 130, min: 90 },
  { key: 'acciones', label: 'Acciones', default: 90, min: 80, align: 'right' },
];

const STORAGE_KEY = 'erse:clientes-table-widths:v1';

type Widths = Record<ColumnKey, number>;
const DEFAULT_WIDTHS = Object.fromEntries(COLUMNS.map((c) => [c.key, c.default])) as Widths;

export function ClientesTable({ clientes }: { clientes: ClienteRow[] }) {
  const [query, setQuery] = React.useState('');
  const [widths, setWidths] = React.useState<Widths>(DEFAULT_WIDTHS);

  // Load persisted widths after mount. We deliberately render defaults on
  // first paint to avoid an SSR/CSR hydration mismatch, then swap to the
  // localStorage values once we're definitely on the client. This is the
  // canonical "load preference from storage" pattern; the lint rule against
  // setState-in-effect is too strict for this case.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Widths>;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot hydration from storage
      setWidths((prev) => ({ ...prev, ...parsed }));
    } catch {
      // localStorage unavailable or corrupted — ignore, fall back to defaults.
    }
  }, []);

  function setWidth(key: ColumnKey, value: number) {
    setWidths((prev) => {
      const col = COLUMNS.find((c) => c.key === key);
      const next = { ...prev, [key]: Math.max(col?.min ?? 60, Math.round(value)) };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === '') return clientes;
    return clientes.filter((c) =>
      [c.rut, c.razon_social, c.persona, c.ciudad, c.contacto, c.email]
        .filter((v): v is string => typeof v === 'string')
        .some((v) => v.toLowerCase().includes(q)),
    );
  }, [clientes, query]);

  return (
    <div className="space-y-3">
      <Input
        type="search"
        placeholder="Buscar por razón social, RUT, contacto, ciudad o email…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="rounded-md border border-border">
        <Table className="table-fixed">
          <colgroup>
            {COLUMNS.map((c) => (
              <col key={c.key} style={{ width: `${widths[c.key]}px` }} />
            ))}
          </colgroup>

          <TableHeader>
            <TableRow>
              {COLUMNS.map((c, index) => (
                <TableHead
                  key={c.key}
                  className={`relative ${c.align === 'right' ? 'text-right' : ''}`}
                >
                  <span className="block truncate pr-2">{c.label}</span>
                  {index < COLUMNS.length - 1 ? (
                    <ResizeHandle
                      currentWidth={widths[c.key]}
                      onResize={(w) => setWidth(c.key, w)}
                    />
                  ) : null}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS.length}
                  className="text-center text-sm text-muted-foreground"
                >
                  {clientes.length === 0
                    ? 'Aún no hay clientes. Agrega el primero con el botón "Nuevo cliente".'
                    : 'No hay clientes que coincidan con la búsqueda.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.rut}>
                  <TableCell className="truncate font-medium" title={c.razon_social}>
                    {c.razon_social}
                  </TableCell>
                  <TableCell className="truncate font-mono text-xs">{c.rut}</TableCell>
                  <TableCell className="truncate">
                    <div className="flex flex-col">
                      <span className="truncate">{c.persona ?? '—'}</span>
                      {c.contacto ? (
                        <span className="truncate text-xs text-muted-foreground">
                          {c.contacto}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="truncate" title={c.ciudad ?? undefined}>
                    {c.ciudad ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <EditClienteButton cliente={c} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {clientes.length}{' '}
        {clientes.length === 1 ? 'cliente' : 'clientes'} · arrastra el borde derecho de cada
        encabezado para ajustar el ancho
      </p>
    </div>
  );
}

/**
 * Tiny drag handle on the right edge of a TableHead. Tracks mouse delta and
 * reports the new total width to the parent. Window-level listeners so the
 * drag survives leaving the header element.
 */
function ResizeHandle({
  currentWidth,
  onResize,
}: {
  currentWidth: number;
  onResize: (width: number) => void;
}) {
  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = currentWidth;

    function onMove(ev: MouseEvent) {
      onResize(startWidth + (ev.clientX - startX));
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  return (
    <span
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation="vertical"
      aria-label="Redimensionar columna"
      className="absolute right-0 top-0 z-10 flex h-full w-2 cursor-col-resize items-center justify-center select-none"
    >
      <span className="h-4 w-px bg-border transition-colors group-hover:bg-primary hover:bg-primary" />
    </span>
  );
}
