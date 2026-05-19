import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: "src/browser.ts",
      formats: ["iife"],
      name: "AvatarStudio",
      fileName: () => "avatar-studio.iife.js"
    },
    rollupOptions: {
      output: {
        exports: "default"
      }
    }
  }
});
