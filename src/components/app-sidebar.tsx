'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Users as UsersIcon,
  UserCircle,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/app/login/actions';

type NavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PRIMARY: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
  { href: '/clientes', label: 'Clientes', icon: UsersIcon },
  { href: '/productos', label: 'Productos', icon: Package },
];

const ADMIN: NavLink[] = [{ href: '/admin/usuarios', label: 'Usuarios', icon: Settings }];

export function AppSidebar({
  displayName,
  isAdmin,
}: {
  displayName: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Close the drawer whenever the user navigates to a different path. This is
  // a reaction to external state (the URL), which is what useEffect is for.
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close mobile drawer on route change
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Mobile top-bar with hamburger */}
      <div className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-border bg-background px-4 lg:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu />
        </Button>
        <span className="font-semibold">ERSE Cotizaciones</span>
      </div>

      {/* Backdrop on mobile when drawer is open */}
      {mobileOpen ? (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:sticky lg:top-0 lg:h-svh lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md">
            <Image
              src="/ERSE_7.png"
              alt="ERSE Electric"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">ERSE Electric</p>
            <p className="truncate text-xs text-muted-foreground">Cotizador</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden"
            aria-label="Cerrar menú"
          >
            <X />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {PRIMARY.map((link) => (
              <SidebarLink key={link.href} link={link} active={isActive(link.href)} />
            ))}
          </ul>

          {isAdmin ? (
            <>
              <p className="mt-6 mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Administración
              </p>
              <ul className="space-y-1">
                {ADMIN.map((link) => (
                  <SidebarLink key={link.href} link={link} active={isActive(link.href)} />
                ))}
              </ul>
            </>
          ) : null}
        </nav>

        {/* User footer */}
        <div className="border-t border-sidebar-border p-3">
          <Link
            href="/perfil"
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              isActive('/perfil')
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'hover:bg-sidebar-accent/60',
            )}
          >
            <UserCircle className="size-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">Mi perfil</p>
            </div>
            <ChevronRight className="size-4 opacity-50" />
          </Link>
          <form action={logoutAction} className="mt-1">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
            >
              <LogOut className="size-5 shrink-0" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

function SidebarLink({ link, active }: { link: NavLink; active: boolean }) {
  const Icon = link.icon;
  return (
    <li>
      <Link
        href={link.href}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          active
            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        )}
      >
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{link.label}</span>
        {active ? <ChevronLeft className="ml-auto size-4 rotate-180 opacity-70" /> : null}
      </Link>
    </li>
  );
}
