'use client';

import { useActionState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { updateProfileAction, type UpdateProfileResult } from './actions';

const initialState: UpdateProfileResult = {};

export function ProfileForm({
  initialNombre,
  email,
}: {
  initialNombre: string;
  email: string;
}) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} disabled readOnly />
        <p className="text-xs text-muted-foreground">
          El email no se puede cambiar desde aquí. Contacta al administrador si necesitas otro.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nombre_completo">Nombre completo</Label>
        <Input
          id="nombre_completo"
          name="nombre_completo"
          type="text"
          defaultValue={initialNombre}
          maxLength={80}
          autoComplete="name"
          required
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Así aparecerás como VENDEDOR(a) en las cotizaciones que crees.
        </p>
      </div>

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {state.success ? (
        <Alert>
          <AlertDescription>Perfil actualizado.</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
