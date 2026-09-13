import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative base so the same build works at the domain root and under
  // https://<user>.github.io/<repo>/ (GitHub Pages project site).
  base: "./",
  plugins: [react()],
  optimizeDeps: {
    // @d2lang/d2 ships a self-contained ~11MB browser bundle with the WASM
    // inlined. Keep esbuild from pre-bundling it (slow / unnecessary).
    exclude: ["@d2lang/d2"],
  },
  server: {
    port: 5173,
  },
});
