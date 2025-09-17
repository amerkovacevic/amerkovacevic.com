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
    <div className="flex min-h-screen flex-col gap-12">
      <header className="page-container pt-6">
        <div className="surface-card flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="text-lg font-semibold sm:text-xl">
            AK Tools
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Button
                onClick={handleSignOut}
                variant="secondary"
                size="sm"
                className="group"
                leftIcon={<ExitIcon />}
                aria-label="Sign out"
              >
                <span className="hidden xs:inline">Sign out</span>
              </Button>
            ) : (
              <Button
                onClick={handleSignIn}
                size="sm"
                className="group"
                leftIcon={<GoogleG />}
                aria-label="Sign in with Google"
              >
                <span className="hidden xs:inline">Sign in</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="page-container flex-1 pb-16">
        <Outlet context={{ user }} />
      </main>

      <footer className="page-container pb-10">
        <div className="flex justify-center gap-6 text-brand-subtle">
          <a
            href="https://github.com/amerkovacevic"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="transition-transform duration-150 hover:scale-110 hover:text-brand-strong"
          >
            <Github className="h-6 w-6" />
          </a>
          <a
            href="https://linkedin.com/in/amerkovacevic"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="transition-transform duration-150 hover:scale-110 hover:text-brand-accent"
          >
            <Linkedin className="h-6 w-6" />
          </a>
          <a
            href="https://instagram.com/am.zzy"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="transition-transform duration-150 hover:scale-110 hover:text-brand-accent"
          >
            <Instagram className="h-6 w-6" />
          </a>
        </div>
      </footer>
    </div>
  );
}
