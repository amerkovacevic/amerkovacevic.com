/// <reference types="vite/client" />

// Describe the Firebase variables we expect at build time so TypeScript
// catches missing or misspelled keys before shipping.

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_APP_ID: string;
}
interface ImportMeta { readonly env: ImportMetaEnv; }
