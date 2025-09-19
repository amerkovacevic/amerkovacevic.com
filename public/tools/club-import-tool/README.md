# FC 26 Club Import Tool Extension

This folder now contains a Chrome-friendly unpacked extension that can be loaded directly into Chrome for testing.

## Project Structure

- `extension/` – Load this directory when adding the unpacked extension in Chrome. It contains the manifest, background service worker, popup UI, content scripts, and icons.
- `src/` – TypeScript sources that power the background service worker and shared utilities. Compile them before testing if you make any changes.
- `fc26-club-exporter.user.js` – Existing userscript kept for reference/testing outside of the extension workflow.
- `tsconfig.json` – TypeScript configuration that targets the `extension` output directory.

## Building the background worker

When you change the TypeScript sources in `src/`, rebuild the extension output:

```bash
npm run build:club-extension
```

The command recompiles the TypeScript handlers into `extension/background/handlers` and `extension/shared`.

## Loading in Chrome

1. Run the build step above (or ensure the compiled files exist).
2. Open `chrome://extensions/` in Chrome.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select the `public/tools/club-import-tool/extension` directory.
5. The "FC 26 Club Import Tool" should now be available for use.

This structure keeps the runtime extension assets separate from the TypeScript sources so you can iterate quickly while still producing a folder that Chrome can load without additional bundling.
