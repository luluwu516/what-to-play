import { defineConfig, loadEnv, type Connect } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import { searchGames, fetchGameDetail } from "./src/lib/bgg-core";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const token = env.BGG_API_TOKEN;

  // In dev, mirror what the Netlify functions do for prod: serve
  // /api/bgg/search and /api/bgg/thing locally so the browser code can
  // call the same URLs in both environments.
  const bggDevProxy = {
    name: "bgg-dev-proxy",
    configureServer(server: { middlewares: Connect.Server }) {
      const respond = (
        res: import("node:http").ServerResponse,
        status: number,
        body: unknown,
      ) => {
        res.statusCode = status;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(body));
      };

      server.middlewares.use("/api/bgg/search", async (req, res) => {
        if (!token) return respond(res, 500, { error: "BGG_API_TOKEN not set in .env.local" });
        try {
          const url = new URL(req.url ?? "", "http://x");
          const hits = await searchGames(url.searchParams.get("q") ?? "", token);
          respond(res, 200, { hits });
        } catch (e) {
          respond(res, 500, { error: (e as Error).message });
        }
      });

      server.middlewares.use("/api/bgg/thing", async (req, res) => {
        if (!token) return respond(res, 500, { error: "BGG_API_TOKEN not set in .env.local" });
        try {
          const url = new URL(req.url ?? "", "http://x");
          const id = Number(url.searchParams.get("id"));
          if (!Number.isFinite(id)) return respond(res, 400, { error: "id required" });
          const detail = await fetchGameDetail(id, token);
          respond(res, 200, { detail });
        } catch (e) {
          respond(res, 500, { error: (e as Error).message });
        }
      });
    },
  };

  return {
    plugins: [
      react(),
      tailwindcss(),
      bggDevProxy,
      // App-shell offline support. The collection lives in IndexedDB and works
      // fully offline; this precaches the HTML/JS/CSS so the app opens with no
      // network. BGG lookups are the one online-only feature and degrade to
      // manual entry when offline.
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        // We already ship a hand-written public/site.webmanifest linked from
        // index.html — don't let the plugin generate a second, conflicting one.
        manifest: false,
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
          // Offline SPA navigations fall back to the cached index.html, except
          // BGG proxy calls, which must always hit the network.
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^\/api\/bgg\//,
              handler: "NetworkOnly",
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
