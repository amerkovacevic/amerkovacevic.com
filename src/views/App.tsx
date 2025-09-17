import { Outlet, Link } from "react-router-dom";
import { auth, googleProvider } from "../firebase";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { ThemeToggle } from "../components/ThemeToggle";
import { Github, Linkedin, Instagram } from "lucide-react";

// Compact brand CTA used for both Sign in / Sign out
const BTN_CTA =
  "group inline-flex items-center justify-center gap-2 rounded-full " +
  "px-4 py-1.5 text-sm font-medium text-white " +
  "bg-brand hover:bg-brand-light dark:hover:bg-brand-dark " +
  "transition-all duration-200 h-9";

// Proper multi-color Google "G" with hover animation via `group-hover`
function GoogleG({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={
        className +
        " shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6"
      }
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill="#4285F4" d="M23.49 12.27c0-.85-.08-1.67-.23-2.46H12v4.66h6.46c-.28 1.5-1.12 2.77-2.39 3.62v3h3.86c2.26-2.08 3.56-5.14 3.56-8.82z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.86-3c-1.07.72-2.44 1.14-4.09 1.14-3.14 0-5.8-2.12-6.75-4.98H1.31v3.13C3.29 21.3 7.31 24 12 24z"/>
      <path fill="#FBBC05" d="M5.25 14.26a7.18 7.18 0 0 1 0-4.52V6.61H1.31A11.98 11.98 0 0 0 0 12c0 1.94.46 3.78 1.31 5.39l3.94-3.13z"/>
      <path fill="#EA4335" d="M12 4.73c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.96 1.12 15.24 0 12 0 7.31 0 3.29 2.7 1.31 6.61l3.94 3.13C6.2 6.85 8.86 4.73 12 4.73z"/>
    </svg>
  );
}

// Simple exit icon that mirrors the hover animation
function ExitIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={
        className +
        " shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6"
      }
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M16 13v-2H7V8l-5 4 5 4v-3h9z" />
      <path d="M20 3H9c-1.1 0-2 .9-2 2v4h2V5h11v14H9v-4H7v4c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
    </svg>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const handleSignIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };
  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-3 sm:px-6">
      {/* Navbar */}
      <header
        className="mt-3 rounded-2xl border bg-white/70 dark:bg-gray-900/60 backdrop-blur
                   dark:border-gray-800 border-gray-200 px-3 sm:px-4 py-2 sm:py-3"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <Link to="/" className="text-lg sm:text-xl font-semibold truncate">
            AK Tools
          </Link>

          {/* Right: Theme + Auth (no greeting) */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <button onClick={handleSignOut} className={BTN_CTA} aria-label="Sign out">
                <ExitIcon />
                <span className="hidden xs:inline">Sign out</span>
              </button>
            ) : (
              <button onClick={handleSignIn} className={BTN_CTA} aria-label="Sign in with Google">
                <GoogleG />
                <span className="hidden xs:inline">Sign in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Page */}
      <main className="mt-4 sm:mt-6">
        <Outlet context={{ user }} />
      </main>

      {/* Footer with socials (icons only) */}
      <footer className="mt-12 pb-6">
        <div className="flex justify-center gap-6 text-gray-600 dark:text-gray-400">
          <a
            href="https://github.com/amerkovacevic"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="hover:text-black dark:hover:text-white transition-transform duration-150 hover:scale-110"
            title="GitHub"
          >
            <Github className="h-6 w-6" />
          </a>
          <a
            href="https://linkedin.com/in/amerkovacevic"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-transform duration-150 hover:scale-110"
            title="LinkedIn"
          >
            <Linkedin className="h-6 w-6" />
          </a>
          <a
            href="https://instagram.com/am.zzy"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hover:text-pink-500 dark:hover:text-pink-400 transition-transform duration-150 hover:scale-110"
            title="Instagram"
          >
            <Instagram className="h-6 w-6" />
          </a>
        </div>
      </footer>
    </div>
  );
}
