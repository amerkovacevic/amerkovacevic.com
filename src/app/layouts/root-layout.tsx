import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Github, Instagram, Linkedin } from "lucide-react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";

import { Button } from "../../shared/components/ui/button";
import { ThemeToggle } from "../../shared/components/theme-toggle";
import { auth, googleProvider } from "../../shared/lib/firebase";

function GoogleG({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${className} shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill="#4285F4" d="M23.49 12.27c0-.85-.08-1.67-.23-2.46H12v4.66h6.46c-.28 1.5-1.12 2.77-2.39 3.62v3h3.86c2.26-2.08 3.56-5.14 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.86-3c-1.07.72-2.44 1.14-4.09 1.14-3.14 0-5.8-2.12-6.75-4.98H1.31v3.13C3.29 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.25 14.26a7.18 7.18 0 0 1 0-4.52V6.61H1.31A11.98 11.98 0 0 0 0 12c0 1.94.46 3.78 1.31 5.39l3.94-3.13z" />
      <path fill="#EA4335" d="M12 4.73c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.96 1.12 15.24 0 12 0 7.31 0 3.29 2.7 1.31 6.61l3.94 3.13C6.2 6.85 8.86 4.73 12 4.73z" />
    </svg>
  );
}

function ExitIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={`${className} shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M16 13v-2H7V8l-5 4 5 4v-3h9z" />
      <path d="M20 3H9c-1.1 0-2 .9-2 2v4h2V5h11v14H9v-4H7v4c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
    </svg>
  );
}

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

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
              background:
                "linear-gradient(120deg, rgba(56,189,248,0.14), transparent 40%), radial-gradient(circle at 20% 20%, rgba(59,130,246,0.18), transparent 60%)",
            }}
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/"
              className="inline-flex items-center rounded-brand-full border border-transparent bg-white/80 px-6 py-3 text-sm font-semibold tracking-[0.26em] text-brand-strong shadow-brand-sm transition-all duration-300 hover:-translate-y-0.5 hover:text-brand-strong/80 dark:bg-surface-overlayDark/80 dark:text-white"
            >
              AK TOOLS
            </Link>
            <div className="flex flex-col gap-3 xs:flex-row xs:items-center xs:justify-end">
              <ThemeToggle />
              {user ? (
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="lg"
                  className="group relative h-12 w-12 min-w-0 overflow-hidden rounded-full border border-transparent bg-gradient-to-br from-brand via-brand-strong to-brand-accent text-white shadow-brand-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-brand"
                  aria-label="Sign out"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background:
                        "linear-gradient(120deg, rgba(255,255,255,0.18), transparent 45%), radial-gradient(circle at 80% 30%, rgba(125,211,252,0.24), transparent 55%)",
                    }}
                  />
                  <span className="relative grid h-full w-full place-items-center">
                    <span className="grid h-8 w-8 place-items-center rounded-brand-full bg-white/20 text-white">
                      <ExitIcon className="h-4 w-4" />
                    </span>
                  </span>
                </Button>
              ) : (
                <Button
                  onClick={handleSignIn}
                  variant="ghost"
                  size="lg"
                  className="group relative h-12 w-12 min-w-0 overflow-hidden rounded-full border border-transparent bg-gradient-to-br from-[#4285F4] via-[#34A853] to-[#EA4335] text-white shadow-brand-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-brand"
                  aria-label="Sign in with Google"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background:
                        "linear-gradient(120deg, rgba(255,255,255,0.2), transparent 45%), radial-gradient(circle at 15% 25%, rgba(66,133,244,0.35), transparent 55%)",
                    }}
                  />
                  <span className="relative grid h-full w-full place-items-center">
                    <span className="grid h-8 w-8 place-items-center rounded-brand-full bg-white/25">
                      <GoogleG className="h-4 w-4" />
                    </span>
                  </span>
                </Button>
              )}
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
