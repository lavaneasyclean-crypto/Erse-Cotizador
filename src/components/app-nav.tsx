'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/app/login/actions';

const PRIMARY_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/cotizaciones', label: 'Cotizaciones' },
] as const;

export function AppNav({
  displayName,
  isAdmin,
}: {
  displayName: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            ERSE Cotizaciones
          </Link>
          <div className="hidden gap-1 md:flex">
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  isActive(link.href)
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin ? (
              <Link
                href="/admin/usuarios"
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  isActive('/admin')
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                Usuarios
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/perfil"
            className={cn(
              'hidden text-sm text-muted-foreground hover:text-foreground md:inline',
              isActive('/perfil') && 'text-foreground',
            )}
            title="Editar mi perfil"
          >
            {displayName}
          </Link>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-t border-border bg-muted/30 px-4 py-1 md:hidden">
        {PRIMARY_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-md px-3 py-1 text-sm whitespace-nowrap transition-colors',
              isActive(link.href)
                ? 'bg-background font-medium text-foreground'
                : 'text-muted-foreground',
            )}
          >
            {link.label}
          </Link>
        ))}
        {isAdmin ? (
          <Link
            href="/admin/usuarios"
            className={cn(
              'rounded-md px-3 py-1 text-sm whitespace-nowrap transition-colors',
              isActive('/admin')
                ? 'bg-background font-medium text-foreground'
                : 'text-muted-foreground',
            )}
          >
            Usuarios
          </Link>
        ) : null}
        <Link
          href="/perfil"
          className={cn(
            'ml-auto rounded-md px-3 py-1 text-sm whitespace-nowrap transition-colors',
            isActive('/perfil')
              ? 'bg-background font-medium text-foreground'
              : 'text-muted-foreground',
          )}
        >
          Mi perfil
        </Link>
      </div>
    </nav>
  );
}
