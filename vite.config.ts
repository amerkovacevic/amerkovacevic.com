import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite bootstraps a React SPA with fast refresh enabled.
export default defineConfig({
  plugins: [react()],
});