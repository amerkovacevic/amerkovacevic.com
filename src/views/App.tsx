import { Outlet, Link, useLocation } from "react-router-dom";
import { auth, googleProvider } from "../firebase";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { useTheme } from "../theme";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const loc = useLocation();
  const { theme, toggle } = useTheme();

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const handleSignIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };
  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header / Navbar */}
      <header className="flex items-center justify-between">
        <Link to="/" className="text-2xl font-semibold">
          Amer Kovacevic
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/pickup"
            className="px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-light dark:hover:bg-brand-dark"
          >
            ⚽ Pickup
          </Link>
          <Link
            to="/links"
            className="px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-light dark:hover:bg-brand-dark"
          >
            🔗 Links
          </Link>
          <Link
  to="/resume"
  className="px-3 py-1.5 rounded-lg bg-brand-light text-white hover:bg-brand dark:bg-brand-dark dark:hover:bg-brand"
>
  📄 Resume
</Link>
<Link
  to="/santa"
  className="px-3 py-1.5 rounded-lg bg-brand-light text-white hover:bg-brand dark:bg-brand-dark dark:hover:bg-brand"
>
  🎁 Santa
</Link>

          {/* Dark/Light toggle */}
          <button
            onClick={toggle}
            className="px-3 py-1.5 rounded-lg border border-transparent bg-brand text-white hover:bg-brand-light dark:hover:bg-brand-dark"
            title="Toggle dark mode"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>

          {/* Auth */}
          {user ? (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
                Hi, {user.displayName}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-light dark:hover:bg-brand-dark"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={handleSignIn}
              className="px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-light dark:hover:bg-brand-dark"
            >
              Sign in
            </button>
          )}
        </nav>
      </header>

      {/* Page content */}
      <main className="mt-6">
        <Outlet context={{ user }} />
      </main>

      {/* Footer */}
      {loc.pathname !== "/" && (
        <footer className="mt-12 text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} AmerKovacevic.com
        </footer>
      )}
    </div>
  );
}
