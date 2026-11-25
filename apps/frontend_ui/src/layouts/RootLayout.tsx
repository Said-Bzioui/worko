import { Link, Outlet } from 'react-router-dom';
import { env } from '@/config/env';

export function RootLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            {env.appName}
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="transition-colors hover:text-foreground">
              Overview
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
