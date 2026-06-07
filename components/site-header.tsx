import Link from "next/link"

export function SiteHeader({ active }: { active?: "register" | "verify" | "admin" }) {
  const links: { href: string; label: string; key: "register" | "verify" | "admin" }[] = [
    { href: "/", label: "Register", key: "register" },
    { href: "/verify", label: "Verify", key: "verify" },
    { href: "/admin", label: "Admin", key: "admin" },
  ]

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m18 2 4 4" />
              <path d="m17 7 3-3" />
              <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />
              <path d="m9 11 4 4" />
              <path d="m5 19-3 3" />
              <path d="m14 4 6 6" />
            </svg>
          </span>
          <span className="text-base font-semibold text-card-foreground">
            Vaccination Drive
          </span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              aria-current={active === link.key ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active === link.key
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
