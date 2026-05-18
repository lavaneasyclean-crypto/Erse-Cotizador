import { redirect } from 'next/navigation';

// Authenticated users land on /dashboard; the proxy bounces unauthenticated
// requests to /login, so this root only needs to forward to the dashboard.
export default function RootPage() {
  redirect('/dashboard');
}
