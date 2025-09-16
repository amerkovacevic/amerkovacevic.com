import { Outlet, Link } from "react-router-dom";
import { auth, googleProvider } from "../firebase";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { useEffect, useState } from "react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  const handleSignIn = async () => { await signInWithPopup(auth, googleProvider); };
  const handleSignOut = async () => { await signOut(auth); };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <header className="flex items-center justify-between">
        <Link to="/" className="text-2xl font-semibold">Pickup Soccer</Link>
        <nav className="flex items-center gap-3">
          <Link to="/new" className="px-3 py-1.5 rounded bg-gray-900 text-white hover:opacity-90">
            Create Game
          </Link>
          {user ? (
            <>
              <span className="text-sm text-gray-600">Hi, {user.displayName}</span>
              <button onClick={handleSignOut} className="px-3 py-1.5 rounded border">Sign out</button>
            </>
          ) : (
            <button onClick={handleSignIn} className="px-3 py-1.5 rounded border">Sign in with Google</button>
          )}
        </nav>
      </header>
      <main className="mt-6">
        <Outlet context={{ user }} />
      </main>
      <footer className="mt-12 text-xs text-gray-500">
        © {new Date().getFullYear()} AmerKovacevic.com
      </footer>
    </div>
  );
}