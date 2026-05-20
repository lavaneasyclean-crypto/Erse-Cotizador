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

import { updateClienteAction, type ClienteActionResult } from './actions';
import { ClienteFormFields, type ClienteDefaults } from './cliente-form-fields';

const initialState: ClienteActionResult = {};

export function EditClienteButton({ cliente }: { cliente: ClienteDefaults & { rut: string } }) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, isPending] = useActionState(updateClienteAction, initialState);
  const formId = `edit-cliente-${cliente.rut}`;

  React.useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => setOpen(false), 600);
      return () => clearTimeout(timer);
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Editar</Button>} />
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
          <DialogDescription>{cliente.razon_social ?? cliente.rut}</DialogDescription>
        </DialogHeader>

        <form action={formAction} id={formId} className="space-y-4">
          {/*
            The RUT input is read-only on the field component, but we still
            submit it so the server action knows which row to update.
          */}
          <ClienteFormFields
            idPrefix={`edit-${cliente.rut}`}
            defaults={cliente}
            rutEditable={false}
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
