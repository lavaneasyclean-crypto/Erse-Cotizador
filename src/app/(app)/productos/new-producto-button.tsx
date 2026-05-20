'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Plus } from 'lucide-react';

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

import { createProductoAction, type ProductoActionResult } from './actions';
import { ProductoFormFields } from './producto-form-fields';

const initialState: ProductoActionResult = {};

export function NewProductoButton() {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, isPending] = useActionState(createProductoAction, initialState);
  const formId = 'new-producto-form';
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        setOpen(false);
        formRef.current?.reset();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button">
            <Plus />
            Nuevo producto
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo producto</DialogTitle>
          <DialogDescription>
            Se agrega al catálogo y queda disponible al cotizar.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} id={formId} className="space-y-4">
          <ProductoFormFields idPrefix="new" skuEditable disabled={isPending} />

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
            {isPending ? 'Guardando…' : 'Crear producto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
