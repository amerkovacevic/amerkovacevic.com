# Pickup Soccer (React + Firebase on Spark)

A minimal site to plan pickup soccer games with friends. Tech: React (Vite + TS) + Tailwind + Firebase Auth + Firestore + Firebase Hosting.

## Quick start

1. Install Node 18+
2. Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Google provider)
   - Create Firestore (Production mode)
   - Hosting: Get started
   - Add a Web App and copy the SDK config
3. Clone/extract this project and run:

   ```bash
   npm install
   cp .env.example .env
   # paste your Firebase values into .env
   ```

4. Local dev:
   ```bash
   npm run dev
   ```

5. Deploy Firestore rules & indexes:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase init # choose existing project, hosting public=dist, SPA=yes
   firebase deploy --only firestore
   ```

6. Build & deploy hosting:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## Custom domain (amerkovacevic.com)

In the Firebase Console → Hosting → Add custom domain → add DNS TXT (verify) → add A/AAAA records → wait for SSL to provision.

## Notes

- Spark plan friendly (no Cloud Functions).
- Soft-enforced max players on the client.
- Edit text in the components to taste.