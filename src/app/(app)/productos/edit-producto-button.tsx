'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Archive, ArchiveRestore } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  toggleProductoActivoAction,
  updateProductoAction,
  type ProductoActionResult,
} from './actions';
import { ProductoFormFields, type ProductoDefaults } from './producto-form-fields';

const initialState: ProductoActionResult = {};

export function EditProductoButton({
  producto,
}: {
  producto: ProductoDefaults & { codigo_sku: string; activo: boolean };
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, isPending] = useActionState(updateProductoAction, initialState);
  const [archiveState, archiveAction, archivePending] = useActionState(
    toggleProductoActivoAction,
    initialState,
  );
  const archiveFormRef = React.useRef<HTMLFormElement>(null);
  const formId = `edit-producto-${producto.codigo_sku}`;

  React.useEffect(() => {
    if (state.success || archiveState.success) {
      const timer = setTimeout(() => setOpen(false), 600);
      return () => clearTimeout(timer);
    }
  }, [state.success, archiveState.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Editar</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar producto</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {producto.codigo_sku}
            {!producto.activo ? (
              <span className="ml-2 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                Archivado
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} id={formId} className="space-y-4">
          <ProductoFormFields
            idPrefix={`edit-${producto.codigo_sku}`}
            defaults={producto}
            skuEditable={false}
            disabled={isPending}
          />

          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          {state.success ? (
            <Alert>
              <AlertDescription>{state.success}</AlertDescription>
            </Alert>
          ) : null}
          {archiveState.error ? (
            <Alert variant="destructive">
              <AlertDescription>{archiveState.error}</AlertDescription>
            </Alert>
          ) : null}
          {archiveState.success ? (
            <Alert>
              <AlertDescription>{archiveState.success}</AlertDescription>
            </Alert>
          ) : null}
        </form>

        <form action={archiveAction} ref={archiveFormRef} className="hidden">
          <input type="hidden" name="codigo_sku" value={producto.codigo_sku} />
          <input type="hidden" name="activo" value={producto.activo ? 'false' : 'true'} />
        </form>

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          {producto.activo ? (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending || archivePending}
                    className="text-amber-700 hover:text-amber-900 dark:text-amber-400"
                  >
                    <Archive />
                    Archivar
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archivar producto</AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>{producto.descripcion}</strong> dejará de aparecer al cotizar.
                    Las cotizaciones que ya lo incluyen no se ven afectadas — la
                    descripción y el precio quedaron como snapshot. Puedes restaurarlo
                    desde el mismo modal cuando quieras.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={archivePending}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => archiveFormRef.current?.requestSubmit()}
                    disabled={archivePending}
                  >
                    Sí, archivar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => archiveFormRef.current?.requestSubmit()}
              disabled={isPending || archivePending}
              className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400"
            >
              <ArchiveRestore />
              Restaurar
            </Button>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending || archivePending}
            >
              Cancelar
            </Button>
            <Button type="submit" form={formId} disabled={isPending || archivePending}>
              {isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
