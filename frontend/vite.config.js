import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
const toastCompatibilityPath = fileURLToPath(
  new URL("./src/lib/toast.js", import.meta.url),
);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    resolve: {
      alias: {
        "react-hot-toast": toastCompatibilityPath,
        "@": path.resolve(fileURLToPath(new URL(".", import.meta.url)), "src"),
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "robots.txt", "sitemap.xml"],
        manifest: {
          name: "Creadent Dental Clinic",
          short_name: "Creadent",
          description: "Creadent Dental Clinic Management System",
          theme_color: "#007FAF",
          background_color: "#ffffff",
          display: "standalone",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "/favicon/android-chrome-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/favicon/android-chrome-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/favicon/apple-touch-icon.png",
              sizes: "180x180",
              type: "image/png",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,json,woff2}"],
          cleanupOutdatedCaches: true,
          navigationPreload: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "google-fonts-stylesheets",
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-webfonts",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: ({ request }) => request.destination === "image",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "app-images",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
    server: {
      port: 25001,
      allowedHosts: ["api.creadentsmiles.com"],
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:25000",
          changeOrigin: true,
        },
        "/graphql": {
          target: env.VITE_API_URL || "http://localhost:25000",
          changeOrigin: true,
        },
        "/socket.io": {
          target: env.VITE_API_URL || "http://localhost:25000",
          changeOrigin: true,
          ws: true,
        },
      },
    },
    preview: {
      allowedHosts: ["api.creadentsmiles.com"],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              const normalizedId = id.replace(/\\/g, "/");

              if (
                normalizedId.includes("/node_modules/react/") ||
                normalizedId.includes("/node_modules/react-dom/") ||
                normalizedId.includes("/node_modules/react-router/") ||
                normalizedId.includes("/node_modules/react-router-dom/") ||
                normalizedId.includes("/node_modules/scheduler/")
              ) {
                return "vendor-react";
              }
              if (
                normalizedId.includes("/node_modules/@mui/") ||
                normalizedId.includes("/node_modules/@emotion/")
              ) {
                return "vendor-mui";
              }
              if (
                normalizedId.includes("/node_modules/framer-motion/") ||
                normalizedId.includes("/node_modules/lucide-react/") ||
                normalizedId.includes("/node_modules/recharts/") ||
                normalizedId.includes("/node_modules/react-toastify/") ||
                normalizedId.includes("/node_modules/react-hot-toast/")
              ) {
                return "vendor-ui";
              }
              if (
                normalizedId.includes("/node_modules/@apollo/client/") ||
                normalizedId.includes("/node_modules/graphql/")
              ) {
                return "vendor-graphql";
              }
              if (
                normalizedId.includes("/node_modules/jspdf/") ||
                normalizedId.includes("/node_modules/@stripe/") ||
                normalizedId.includes("/node_modules/axios/") ||
                normalizedId.includes("/node_modules/socket.io-client/")
              ) {
                return "vendor-utils";
              }
              if (
                normalizedId.includes("/node_modules/react-icons/") ||
                normalizedId.includes("/node_modules/bootstrap/") ||
                normalizedId.includes("/node_modules/react-countup/")
              ) {
                return "vendor-libs";
              }
              return "vendor-misc";
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    }
  };
});
