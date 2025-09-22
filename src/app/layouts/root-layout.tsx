import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Github, Instagram, Linkedin, Menu, X } from "lucide-react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";

import { ThemeToggle } from "../../shared/components/theme-toggle";
import { auth, googleProvider } from "../../shared/lib/firebase";
import { cn } from "../../shared/lib/classnames";

// Lightweight Google "G" icon for the auth button to avoid extra assets.
function GoogleG({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${className} shrink-0`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill="#4285F4" d="M23.49 12.27c0-.85-.08-1.67-.23-2.46H12v4.66h6.46c-.28 1.5-1.12 2.77-2.39 3.62v3h3.86c2.26-2.08 3.56-5.14 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.86-3c-1.07.72-2.44 1.14-4.09 1.14-3.14 0-5.8-2.12-6.75-4.98H1.31v3.13C3.29 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.25 14.26a7.18 7.18 0 0 1 0-4.52V6.61H1.31A11.98 11.98 0 0 0 0 12c0 1.94.46 3.78 1.31 5.39l3.94-3.13z" />
      <path fill="#EA4335" d="M12 4.73c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.96 1.12 15.24 0 12 0 7.31 0 3.29 2.7 1.31 6.61l3.94 3.13C6.2 6.85 8.86 4.73 12 4.73z" />
    </svg>
  );
}

// Shared page chrome with authentication controls and footer links.
export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { id: "home", label: "Amer", to: "/" },
    { id: "apps", label: "Apps", to: "/tools" },
    { id: "professional", label: "Professional", to: "/professional" },
  ] as const;

  // Keep layout state aligned with Firebase auth changes.
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const handleSignIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div className="relative flex min-h-screen flex-col gap-12">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-18rem] h-[28rem] w-[60rem] -translate-x-1/2 rounded-[50%] bg-brand/6 blur-[140px]" />
        <div className="absolute bottom-[-15rem] right-[-8rem] h-[24rem] w-[36rem] rounded-full bg-brand-accent/12 blur-[120px]" />
      </div>

      <header className="page-container pt-8">
        <div className="relative overflow-hidden rounded-[2.25rem] border border-border-light/70 bg-surface/70 px-6 py-5 shadow-brand-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-brand dark:bg-surface-overlayDark/70">
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            aria-hidden
            style={{
              background: "rgba(56,189,248,0.14)",
            }}
          />
          <div className="relative flex flex-col gap-5">
            <div className="flex items-center justify-between md:hidden">
              <button
                type="button"
                onClick={() => setMobileNavOpen((open) => !open)}
                aria-controls="primary-navigation"
                aria-expanded={mobileNavOpen}
                className="inline-flex items-center gap-2 rounded-full border border-border-light/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-strong shadow-brand-sm transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:border-border-dark/60 dark:bg-white/10 dark:text-brand-foreground"
              >
                {mobileNavOpen ? (
                  <X className="h-4 w-4" aria-hidden />
                ) : (
                  <Menu className="h-4 w-4" aria-hidden />
                )}
                <span>Menu</span>
              </button>
              <AuthControls
                user={user}
                onSignIn={handleSignIn}
                onSignOut={handleSignOut}
                className="md:hidden"
              />
            </div>
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <nav
                id="primary-navigation"
                className={cn(
                  "grid gap-3 text-sm md:flex md:flex-wrap md:items-center",
                  "mt-4 md:mt-0",
                  mobileNavOpen ? "grid" : "hidden md:flex"
                )}
              >
                {navItems.map((item) => {
                  const active =
                    item.to === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(item.to);
                  return (
                    <Link
                      key={item.id}
                      to={item.to}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-4 py-2 font-medium uppercase tracking-[0.24em] transition-all duration-200",
                        "w-full justify-between text-sm md:w-auto md:justify-start",
                        active
                          ? "border-brand bg-brand/15 text-brand shadow-brand-sm dark:border-brand/60 dark:bg-brand/25 dark:text-brand-foreground"
                          : "border-border-light/70 bg-white/70 text-brand-muted shadow-none hover:-translate-y-0.5 hover:shadow-brand dark:border-border-dark/60 dark:bg-white/10 dark:text-brand-subtle"
                      )}
                    >
                      <span>{item.label}</span>
                      {active ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white text-[0.6rem] shadow-brand-sm dark:bg-brand-strong">
                          ●
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
              <AuthControls
                user={user}
                onSignIn={handleSignIn}
                onSignOut={handleSignOut}
                className="hidden w-full justify-end md:ml-auto md:flex md:w-auto"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="page-container flex-1 pb-16">
        <div className="relative overflow-hidden rounded-[2.75rem] border border-border-light/60 bg-surface/75 px-4 py-8 shadow-brand-sm backdrop-blur-xl dark:border-border-dark/70 dark:bg-surface-overlayDark/80 sm:px-8 sm:py-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 20% 20%, rgba(56,189,248,0.16), transparent 60%), radial-gradient(circle at 75% 40%, rgba(59,130,246,0.22), transparent 55%)",
            }}
          />
          <div className="relative">
            <Outlet context={{ user }} />
          </div>
        </div>
      </main>

      <footer className="page-container pb-14">
        <div className="surface-card relative overflow-hidden rounded-brand-xl px-6 py-6">
          <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" aria-hidden />
          <div className="relative flex items-center justify-center gap-4 text-brand-strong dark:text-brand-foreground">
            <a
              href="https://github.com/amerkovacevic"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="rounded-brand-full bg-brand/10 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand/20 dark:bg-brand/20 dark:hover:bg-brand/30"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://linkedin.com/in/amerkovacevic"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="rounded-brand-full bg-brand/10 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand/20 dark:bg-brand/20 dark:hover:bg-brand/30"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href="https://instagram.com/am.zzy"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="rounded-brand-full bg-brand/10 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand/20 dark:bg-brand/20 dark:hover:bg-brand/30"
            >
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Reusable auth + theme controls shown in both mobile and desktop headers.
function AuthControls({
  user,
  onSignIn,
  onSignOut,
  className,
}: {
  user: User | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <ThemeToggle className="shrink-0" />
      {user ? (
        <button
          onClick={onSignOut}
          className={cn(
            "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl shadow-brand-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
            "border border-border-light bg-white text-brand hover:bg-brand/10",
            "dark:border-border-dark dark:bg-brand-strong dark:text-white dark:hover:bg-brand-strong/90"
          )}
        >
          <span aria-hidden>🚪</span>
          <span className="sr-only">Sign out</span>
        </button>
      ) : (
        <button
          onClick={onSignIn}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border-light bg-white text-brand shadow-brand-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent dark:border-border-dark dark:bg-slate-900"
        >
          <GoogleG className="h-5 w-5" />
          <span className="sr-only">Sign in with Google</span>
        </button>
      )}
    </div>
  );
}
