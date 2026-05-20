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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/password-input';

import { updateUserAction, type CreateUserResult } from './actions';

const initialState: CreateUserResult = {};

export function EditUserButton({
  userId,
  email,
  initialNombre,
  initialIsAdmin,
  isSelf,
}: {
  userId: string;
  email: string;
  initialNombre: string;
  initialIsAdmin: boolean;
  isSelf: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, isPending] = useActionState(updateUserAction, initialState);

  // Close the dialog after a successful save (after the next paint so the
  // user sees the success message momentarily).
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
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>{email}</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4" id={`edit-user-${userId}`}>
          <input type="hidden" name="user_id" value={userId} />

          <div className="space-y-2">
            <Label htmlFor={`nombre-${userId}`}>Nombre completo</Label>
            <Input
              id={`nombre-${userId}`}
              name="nombre_completo"
              type="text"
              defaultValue={initialNombre}
              maxLength={80}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`password-${userId}`}>Nueva contraseña</Label>
            <PasswordInput
              id={`password-${userId}`}
              name="password"
              autoComplete="new-password"
              minLength={8}
              disabled={isPending}
              placeholder="Dejar vacío para no cambiarla"
            />
            <p className="text-xs text-muted-foreground">
              Si la cambias, compártela con el usuario por un canal seguro.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_admin"
              defaultChecked={initialIsAdmin}
              className="h-4 w-4 rounded border-input"
              disabled={isPending || isSelf}
            />
            <span>Es administrador {isSelf ? '(no puedes quitarte el rol a ti mismo)' : ''}</span>
          </label>

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
          <Button type="submit" form={`edit-user-${userId}`} disabled={isPending}>
            {isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
