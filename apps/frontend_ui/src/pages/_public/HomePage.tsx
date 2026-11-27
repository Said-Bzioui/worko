import {
  ArrowDown,
  Blocks,
  Building2,
  CheckSquare2,
  FolderKanban,
  Layers3,
  ShieldCheck,
  Users,
} from "lucide-react"

const workLevels = [
  {
    icon: Building2,
    name: "Organization",
    detail: "Your company and its members",
  },
  {
    icon: Layers3,
    name: "Workspace",
    detail: "Separate areas for different kinds of work",
  },
  { icon: Users, name: "Team", detail: "People working toward a shared goal" },
  {
    icon: FolderKanban,
    name: "Project",
    detail: "A goal your team is delivering",
  },
  { icon: Blocks, name: "Board", detail: "A visual view of progress" },
  {
    icon: CheckSquare2,
    name: "Issue",
    detail: "One task, bug, or piece of work",
  },
]

export function HomePage() {
  return (
    <div className="grid min-h-0 flex-1 content-center gap-5 md:grid-cols-[0.9fr_1.1fr] md:gap-10">
      <section className="flex flex-col justify-center">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card py-1 pr-3 pl-1 text-xs font-medium text-muted-foreground">
          <img src="/worko-mark.svg" alt="" className="size-7 rounded-lg" />
          Team work, in one place
        </span>
        <h1 className="mt-4 text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Make room for{" "}
          <span className="text-muted-foreground">great work.</span>
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          Worko brings your organization, teams, and projects into one clear
          structure. Give people the right space to collaborate, and make access
          easy to manage.
        </p>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground sm:text-sm">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="size-4" />
            Membership and roles
          </span>
          <span className="inline-flex items-center gap-2">
            <Layers3 aria-hidden="true" className="size-4" />
            Organized workspaces
          </span>
        </div>
        <a
          href="#work-hierarchy"
          className="mt-6 inline-flex h-10 w-fit items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85"
        >
          Explore the Worko structure
          <ArrowDown aria-hidden="true" className="size-4" />
        </a>
      </section>

      <section
        id="work-hierarchy"
        aria-labelledby="hierarchy-heading"
        className="min-h-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6"
      >
        <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
          <div>
            <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
              How work is organized
            </p>
            <h2
              id="hierarchy-heading"
              className="mt-1 text-lg font-semibold tracking-tight sm:text-xl"
            >
              One connected hierarchy
            </h2>
          </div>
          <span className="hidden rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
            Company → task
          </span>
        </div>

        <ol className="grid gap-1 sm:gap-1.5">
          {workLevels.map(({ icon: Icon, name, detail }, index) => (
            <li key={name} className="relative flex items-center gap-3">
              <div className="relative flex w-8 shrink-0 justify-center self-stretch">
                {index < workLevels.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute top-7 bottom-[-0.4rem] w-px bg-border"
                  />
                )}
                <span className="relative z-10 flex size-8 items-center justify-center rounded-lg border border-border bg-background text-foreground">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
              </div>
              <div className="flex min-h-8 min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60 sm:px-3">
                <span className="text-sm font-medium">{name}</span>
                <span className="hidden truncate text-right text-xs text-muted-foreground sm:block">
                  {detail}
                </span>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-3 rounded-xl bg-muted/60 px-3 py-2.5 sm:mt-4 sm:px-4">
          <p className="text-xs leading-5 text-muted-foreground sm:text-sm">
            Organizations, workspaces, and access management are available now.
            Project boards and issue tracking are under development.
          </p>
        </div>
      </section>
    </div>
  )
}
