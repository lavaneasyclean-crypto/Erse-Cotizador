'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';

import { deleteUserAction, type CreateUserResult } from './actions';

const initialState: CreateUserResult = {};

export function DeleteUserButton({ userId, email }: { userId: string; email: string }) {
  const [state, formAction, isPending] = useActionState(deleteUserAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar el usuario ${email}? Esta acción no se puede deshacer.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="user_id" value={userId} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={isPending}
        className="text-rose-700 hover:text-rose-900 dark:text-rose-400"
      >
        {isPending ? '…' : 'Eliminar'}
      </Button>
      {state.error ? <p className="mt-1 text-xs text-rose-600">{state.error}</p> : null}
    </form>
  );
}
