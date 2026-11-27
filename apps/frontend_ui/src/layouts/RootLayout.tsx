import { Link, Outlet } from "react-router-dom"

export function RootLayout() {
  return (
    <div className="flex h-dvh max-h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link
            to="/"
            aria-label="Worko home"
            className="inline-flex items-center"
          >
            <img
              src="/worko-logo.svg"
              alt="Worko"
              className="h-7 w-auto dark:hidden"
            />
            <img
              src="/worko-logo-dark.svg"
              alt="Worko"
              className="hidden h-7 w-auto dark:block"
            />
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="transition-colors hover:text-foreground">
              Overview
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-4 py-3 sm:px-6 sm:py-4">
        <Outlet />
      </main>
    </div>
  )
}
