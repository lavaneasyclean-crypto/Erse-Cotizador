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

import { createClienteAction, type ClienteActionResult } from './actions';
import { ClienteFormFields } from './cliente-form-fields';

const initialState: ClienteActionResult = {};

export function NewClienteButton() {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, isPending] = useActionState(createClienteAction, initialState);
  const formId = 'new-cliente-form';
  const formRef = React.useRef<HTMLFormElement>(null);

  // Close + reset on success
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
            Nuevo cliente
          </Button>
        }
      />
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
          <DialogDescription>
            Sólo el RUT y la razón social son obligatorios. Lo demás lo puedes completar después.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} id={formId} className="space-y-4">
          <ClienteFormFields idPrefix="new" rutEditable disabled={isPending} />

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
            {isPending ? 'Guardando…' : 'Crear cliente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
