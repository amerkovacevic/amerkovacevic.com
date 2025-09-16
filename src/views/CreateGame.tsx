import { FormEvent, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { User } from "firebase/auth";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc, Timestamp } from "firebase/firestore";

type Ctx = { user: User | null };

export default function CreateGame() {
  const { user } = useOutletContext<Ctx>();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) { alert("Please sign in"); return; }

    const form = e.currentTarget as HTMLFormElement & {
      title: HTMLInputElement;
      dateTime: HTMLInputElement;
      fieldName: HTMLInputElement;
      maxPlayers: HTMLInputElement;
    };

    const title = form.title.value.trim();
    const dateTimeLocal = form.dateTime.value;
    const fieldName = form.fieldName.value.trim();
    const maxPlayers = parseInt(form.maxPlayers.value, 10);

    if (!title || !dateTimeLocal || !fieldName || !maxPlayers) return;

    setBusy(true);
    const when = Timestamp.fromDate(new Date(dateTimeLocal));
    const gameRef = await addDoc(collection(db, "games"), {
      title,
      dateTime: when,
      fieldName,
      maxPlayers,
      organizerUid: user.uid,
      status: "open",
      createdAt: serverTimestamp(),
    });

    await setDoc(doc(db, "fields", fieldName.toLowerCase().replace(/\s+/g, "-")), {
      name: fieldName
    }, { merge: true });

    setBusy(false);
    nav("/");
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Create a Game</h2>
      <form onSubmit={onSubmit} className="grid gap-3 max-w-md">
        <input name="title" placeholder="7v7 at Tower Grove" className="border rounded px-3 py-2" required />
        <label className="text-sm">
          Date & time
          <input name="dateTime" type="datetime-local" className="border rounded px-3 py-2 w-full" required />
        </label>
        <input name="fieldName" placeholder="Field name" className="border rounded px-3 py-2" required />
        <label className="text-sm">
          Max players (2–30)
          <input name="maxPlayers" type="number" min={2} max={30} defaultValue={14} className="border rounded px-3 py-2 w-full" required />
        </label>
        <button disabled={!user || busy} className="px-3 py-2 rounded bg-gray-900 text-white hover:opacity-90 disabled:opacity-50">
          {busy ? "Creating..." : "Create game"}
        </button>
        {!user && <div className="text-sm text-red-600">Sign in to create a game.</div>}
      </form>
    </div>
  );
}