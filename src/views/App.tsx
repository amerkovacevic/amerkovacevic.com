import { Outlet, Link, NavLink, useLocation } from "react-router-dom";
import { auth, googleProvider } from "../firebase";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { ThemeToggle } from "../components/ThemeToggle"; // ← from earlier
import { useTheme } from "../theme";

const BTN = "inline-flex items-center rounded-lg px-3 py-1.5 bg-gray-800 text-white hover:bg-gray-700 transition";
const BTN_ACTIVE = "inline-flex items-center rounded-lg px-3 py-1.5 bg-brand-light text-white dark:bg-brand-dark transition";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const loc = useLocation();
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const handleSignIn = async () => { await signInWithPopup(auth, googleProvider); };
  const handleSignOut = async () => { await signOut(auth); };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Navbar */}
      <header className="rounded-2xl border bg-white/70 dark:bg-gray-900/60 backdrop-blur px-4 py-3
                         dark:border-gray-800 border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-semibold">Amer Kovacevic</Link>
          <nav className="hidden sm:flex gap-2">
            <NavLink to="/" end className={({isActive}) => isActive ? BTN_ACTIVE : BTN}>Apps</NavLink>
            <NavLink to="/resume" className={({isActive}) => isActive ? BTN_ACTIVE : BTN}>Resume</NavLink>
            <NavLink to="/links"  className={({isActive}) => isActive ? BTN_ACTIVE : BTN}>Links</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">
                Hi, {user.displayName}
              </span>
              <button onClick={handleSignOut} className={BTN}>Sign out</button>
            </>
          ) : (
            <button onClick={handleSignIn} className={BTN}>Sign in</button>
          )}
        </div>
      </header>

      {/* Page */}
      <main className="mt-6">
        <Outlet context={{ user }} />
      </main>

      {/* Footer */}
      {loc.pathname !== "/" && (
        <footer className="mt-12 text-xs text-gray-500 dark:text-gray-400 text-center">
          © {new Date().getFullYear()} AmerKovacevic.com
        </footer>
      )}
    </div>
  );
}
