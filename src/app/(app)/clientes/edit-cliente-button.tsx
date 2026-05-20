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
  toggleClienteActivoAction,
  updateClienteAction,
  type ClienteActionResult,
} from './actions';
import { ClienteFormFields, type ClienteDefaults } from './cliente-form-fields';

const initialState: ClienteActionResult = {};

export function EditClienteButton({
  cliente,
}: {
  cliente: ClienteDefaults & { rut: string; activo: boolean };
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, isPending] = useActionState(updateClienteAction, initialState);
  const [archiveState, archiveAction, archivePending] = useActionState(
    toggleClienteActivoAction,
    initialState,
  );
  const archiveFormRef = React.useRef<HTMLFormElement>(null);
  const formId = `edit-cliente-${cliente.rut}`;

  React.useEffect(() => {
    if (state.success || archiveState.success) {
      const timer = setTimeout(() => setOpen(false), 600);
      return () => clearTimeout(timer);
    }
  }, [state.success, archiveState.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Editar</Button>} />
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
          <DialogDescription>
            {cliente.razon_social ?? cliente.rut}
            {!cliente.activo ? (
              <span className="ml-2 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                Archivado
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} id={formId} className="space-y-4">
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

        {/* The archive form lives outside the edit form so its submit doesn't
            fire field validation on the main fields. */}
        <form action={archiveAction} ref={archiveFormRef} className="hidden">
          <input type="hidden" name="rut" value={cliente.rut} />
          <input type="hidden" name="activo" value={cliente.activo ? 'false' : 'true'} />
        </form>

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          {cliente.activo ? (
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
                  <AlertDialogTitle>Archivar cliente</AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>{cliente.razon_social}</strong> dejará de aparecer al crear
                    nuevas cotizaciones. Las cotizaciones existentes que lo referencian no
                    se ven afectadas. Puedes restaurarlo desde el mismo modal cuando
                    quieras.
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
