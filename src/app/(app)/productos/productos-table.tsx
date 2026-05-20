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
import { formatCLP } from '@/lib/format/format';

import { EditProductoButton } from './edit-producto-button';

export type ProductoRow = {
  codigo_sku: string;
  descripcion: string;
  precio_neto: number;
};

type ColumnKey = 'codigo_sku' | 'descripcion' | 'precio_neto' | 'acciones';

const COLUMNS: {
  key: ColumnKey;
  label: string;
  default: number;
  min: number;
  align?: 'right';
}[] = [
  { key: 'codigo_sku', label: 'Código SKU', default: 160, min: 110 },
  { key: 'descripcion', label: 'Descripción', default: 480, min: 200 },
  { key: 'precio_neto', label: 'Precio neto', default: 130, min: 100, align: 'right' },
  { key: 'acciones', label: 'Acciones', default: 90, min: 80, align: 'right' },
];

const STORAGE_KEY = 'erse:productos-table-widths:v1';

type Widths = Record<ColumnKey, number>;
const DEFAULT_WIDTHS = Object.fromEntries(COLUMNS.map((c) => [c.key, c.default])) as Widths;

// Cap the visible rows so the page stays snappy with 1.510 productos. Filtering
// runs on the full list; the slice happens after the filter so search still
// reaches the last row.
const VISIBLE_LIMIT = 100;

export function ProductosTable({ productos }: { productos: ProductoRow[] }) {
  const [query, setQuery] = React.useState('');
  const [widths, setWidths] = React.useState<Widths>(DEFAULT_WIDTHS);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Widths>;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot hydration from storage
      setWidths((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore
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
    if (q === '') return productos;
    return productos.filter(
      (p) =>
        p.codigo_sku.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q),
    );
  }, [productos, query]);

  const visible = filtered.slice(0, VISIBLE_LIMIT);

  return (
    <div className="space-y-3">
      <Input
        type="search"
        placeholder="Buscar por código SKU o descripción…"
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
            {visible.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS.length}
                  className="text-center text-sm text-muted-foreground"
                >
                  {productos.length === 0
                    ? 'Aún no hay productos.'
                    : 'No hay productos que coincidan.'}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((p) => (
                <TableRow key={p.codigo_sku}>
                  <TableCell className="truncate font-mono text-xs">{p.codigo_sku}</TableCell>
                  <TableCell className="truncate" title={p.descripcion}>
                    {p.descripcion}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${formatCLP(p.precio_neto)}
                  </TableCell>
                  <TableCell className="text-right">
                    <EditProductoButton producto={p} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length > VISIBLE_LIMIT
          ? `Mostrando ${VISIBLE_LIMIT} de ${filtered.length.toLocaleString('es-CL')} resultados — refina la búsqueda para ver el resto.`
          : `${filtered.length.toLocaleString('es-CL')} de ${productos.length.toLocaleString('es-CL')} productos`}{' '}
        · arrastra el borde de cada encabezado para ajustar el ancho
      </p>
    </div>
  );
}

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
      <span className="h-4 w-px bg-border" />
    </span>
  );
}
