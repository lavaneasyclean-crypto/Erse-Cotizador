import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatFecha } from '@/lib/format/format';

import { NewUserForm } from './new-user-form';
import { DeleteUserButton } from './delete-user-button';
import { EditUserButton } from './edit-user-button';

export const metadata = {
  title: 'Usuarios — ERSE Admin',
};

export default async function AdminUsuariosPage() {
  const { user: currentUser } = await requireAdmin();

  const admin = createAdminClient();

  const [{ data: usersResult, error: usersError }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    admin.from('profiles').select('id, nombre_completo, is_admin'),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground">
          Gestiona los vendedores con acceso a ERSE Cotizaciones.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Crear nuevo usuario</CardTitle>
          <CardDescription>
            El usuario podrá iniciar sesión inmediatamente con la contraseña temporal que le
            asignes. Le tocará cambiarla en /perfil cuando entre por primera vez.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewUserForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios actuales</CardTitle>
          <CardDescription>
            {usersResult?.users.length ?? 0}{' '}
            {usersResult?.users.length === 1 ? 'usuario' : 'usuarios'} con acceso.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {usersError ? (
            <p className="p-6 text-sm text-rose-600">{usersError.message}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(usersResult?.users ?? []).map((u) => {
                  const profile = profileById.get(u.id);
                  const isAdmin = profile?.is_admin ?? false;
                  const isSelf = u.id === currentUser.id;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {profile?.nombre_completo ?? '—'}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
                          >
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline">Vendedor</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatFecha(u.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <EditUserButton
                            userId={u.id}
                            email={u.email ?? ''}
                            initialNombre={profile?.nombre_completo ?? ''}
                            initialIsAdmin={isAdmin}
                            isSelf={isSelf}
                          />
                          {isSelf ? (
                            <span className="px-2 text-xs text-muted-foreground">tú</span>
                          ) : (
                            <DeleteUserButton userId={u.id} email={u.email ?? ''} />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
