'use client';

import * as React from 'react';
import { useActionState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
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

import { updateProductoAction, type ProductoActionResult } from './actions';
import { ProductoFormFields, type ProductoDefaults } from './producto-form-fields';

const initialState: ProductoActionResult = {};

export function EditProductoButton({
  producto,
}: {
  producto: ProductoDefaults & { codigo_sku: string };
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, isPending] = useActionState(updateProductoAction, initialState);
  const formId = `edit-producto-${producto.codigo_sku}`;

  React.useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => setOpen(false), 600);
      return () => clearTimeout(timer);
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Editar</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar producto</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {producto.codigo_sku}
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
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
