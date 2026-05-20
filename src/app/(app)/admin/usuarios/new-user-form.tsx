'use client';

import { useActionState, useRef, useEffect } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/password-input';

import { createUserAction, type CreateUserResult } from './actions';

const initialState: CreateUserResult = {};

export function NewUserForm() {
  const [state, formAction, isPending] = useActionState(createUserAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset the form after a successful create so the next user can be added
  // without leftover values (and to avoid double-submits).
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="off"
            required
            disabled={isPending}
            placeholder="vendedor@erse.cl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nombre_completo">Nombre completo</Label>
          <Input
            id="nombre_completo"
            name="nombre_completo"
            type="text"
            maxLength={80}
            required
            disabled={isPending}
            placeholder="Nombre Apellido"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña temporal</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={isPending}
            placeholder="Mínimo 8 caracteres"
          />
          <p className="text-xs text-muted-foreground">
            Compártela con el nuevo usuario por un canal seguro. Podrá cambiarla en /perfil.
          </p>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_admin"
              className="h-4 w-4 rounded border-input"
              disabled={isPending}
            />
            <span>Es administrador (puede gestionar usuarios)</span>
          </label>
        </div>
      </div>

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

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creando…' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  );
}
