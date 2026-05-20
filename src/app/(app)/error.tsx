'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Next.js error boundary for everything under `(app)`. Catches uncaught
 * exceptions from Server Components, Server Actions and Client Components
 * alike, and renders a friendly page so the user sees something better
 * than a blank screen or a leaked stack trace. The raw error stays in the
 * server logs (and the browser console in development) for debugging.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log to the browser console — Next already logs the server-side stack
  // trace to the runtime. Keep this side-effect-only so React doesn't loop.
  React.useEffect(() => {
    // Intentional: surface the cause in browser dev tools.
    console.error('App error boundary caught:', error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          <div className="rounded-md bg-destructive/10 p-2 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <CardTitle>Algo salió mal</CardTitle>
            <CardDescription>
              No pudimos cargar esta página. El error quedó registrado en los logs del
              servidor; si vuelve a aparecer contacta al administrador.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => reset()}>
            Reintentar
          </Button>
          <Link href="/dashboard" className={buttonVariants({ variant: 'outline' })}>
            Volver al dashboard
          </Link>
          {error.digest ? (
            <p className="mt-2 w-full text-xs text-muted-foreground">
              Código de referencia: <span className="font-mono">{error.digest}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
