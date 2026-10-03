import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [react(), dts({ entryRoot: "src", tsconfigPath: "./tsconfig.json" })],
  test: {
    environment: "jsdom",
    setupFiles: ["src/testing/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/testing/setup.ts",
      ],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        client: resolve(__dirname, "src/client.ts"),
        "testing/index": resolve(__dirname, "src/testing/index.tsx"),
        "waveform/index": resolve(__dirname, "src/waveform/index.ts"),
        "experimental-gapless/index": resolve(__dirname, "src/experimental-gapless/index.ts"),
        "equalizer/index": resolve(__dirname, "src/equalizer/index.ts"),
        "spatial/index": resolve(__dirname, "src/spatial/index.ts"),
        "transcript/index": resolve(__dirname, "src/transcript/index.ts"),
        "remote/index": resolve(__dirname, "src/remote/index.ts"),
        "cast/index": resolve(__dirname, "src/cast/index.ts"),
        "crossfade/index": resolve(__dirname, "src/crossfade/index.ts"),
        "tts/index": resolve(__dirname, "src/tts/index.ts"),
        "devtools/index": resolve(__dirname, "src/devtools/index.ts"),
      },
      name: "Ginger",
      formats: ["es", "cjs"],
      fileName: (format, entryName) => `${entryName}.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        exports: "named",
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    sourcemap: true,
  },
});
