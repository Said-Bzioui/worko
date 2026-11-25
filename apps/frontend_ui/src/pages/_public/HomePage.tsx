import { env } from '@/config/env';

export function HomePage() {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-8">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
          Frontend UI Ready
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">{env.appName}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          React + TypeScript + Vite + Tailwind CSS + shadcn/ui application connected to the Worko
          NestJS API.
        </p>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-4">
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              API Base URL
            </dt>
            <dd className="mt-1 font-mono text-sm">{env.apiBaseUrl}</dd>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Backend Origin
            </dt>
            <dd className="mt-1 font-mono text-sm">{env.backendOrigin}</dd>
          </div>
        </dl>

        <p className="mt-6 font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </p>
      </div>
    </section>
  );
}
