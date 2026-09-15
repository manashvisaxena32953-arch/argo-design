import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

const LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/problems", label: "Problem Library" },
  { to: "/history", label: "History" },
] as const;

export function AppNav() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="mono grid size-7 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            L
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            LLD Arena
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === "/" }}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{
                className: "bg-secondary text-foreground font-medium",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="mono hidden text-[11px] text-muted-foreground sm:block">
            Practice. Design. Get Feedback. Improve.
          </span>
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
