'use client';

import * as React from 'react';
import { useActionState } from 'react';

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

import { deleteUserAction, type CreateUserResult } from './actions';

const initialState: CreateUserResult = {};

export function DeleteUserButton({ userId, email }: { userId: string; email: string }) {
  const [state, formAction, isPending] = useActionState(deleteUserAction, initialState);
  const formRef = React.useRef<HTMLFormElement>(null);

  function confirmDelete() {
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form ref={formRef} action={formAction} className="hidden">
        <input type="hidden" name="user_id" value={userId} />
      </form>

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              className="text-rose-700 hover:text-rose-900 dark:text-rose-400"
            >
              {isPending ? '…' : 'Eliminar'}
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar el usuario <strong>{email}</strong>. Esta acción no se puede
              deshacer y todas sus cotizaciones quedan asociadas a un vendedor inexistente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {state.error ? <p className="mt-1 text-xs text-rose-600">{state.error}</p> : null}
    </>
  );
}
