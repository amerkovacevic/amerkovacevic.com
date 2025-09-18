// PostCSS wires Tailwind and Autoprefixer into Vite's build pipeline.
// Keeping the config tiny makes it obvious no other transforms run here.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}