import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const aiHandler = require("./api/ai.js");
const modelSelectorRemoteHandler = require("./api/model-selector-remote.js");

export default defineConfig({
  plugins: [
    react(),
    {
      name: "summary-api-dev-server",
      configureServer(server) {
        server.middlewares.use("/api/ai", (req, res) => aiHandler(req, res));
        server.middlewares.use("/api/model-selector-remote", (req, res) => modelSelectorRemoteHandler(req, res));
      }
    }
  ],
  server: {
    host: "127.0.0.1",
    port: 4177
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
