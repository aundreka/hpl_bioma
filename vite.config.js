import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

function renameBuildFile(fileName) {
  let outDir = "dist";

  return {
    name: "rename-build-file",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const fromPath = path.resolve(process.cwd(), outDir, "index.html");
      const toPath = path.resolve(process.cwd(), outDir, fileName);

      if (!fs.existsSync(fromPath)) return;
      if (fs.existsSync(toPath)) {
        fs.rmSync(toPath, { force: true });
      }

      fs.renameSync(fromPath, toPath);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile(),
    renameBuildFile("Bioma_MIP2.html"),
  ],
  build: {
    assetsInlineLimit: 1024 * 1024 * 1024,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
