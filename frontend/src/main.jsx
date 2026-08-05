import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { ApolloProvider } from "@apollo/client";
import client from "./apolloClient";
import { HelmetProvider } from "react-helmet-async";
import { registerSW } from "virtual:pwa-register";

// After deploy, stale tabs may request old hashed chunks. A 404 (not index.html)
// or MIME mismatch should trigger one hard reload to pick up the new manifest.
const reloadForStaleAssets = () => {
  const reloadKey = "pwa-stale-asset-reload";
  if (sessionStorage.getItem(reloadKey)) {
    return;
  }
  sessionStorage.setItem(reloadKey, "1");
  window.location.reload();
};

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  reloadForStaleAssets();
});

window.addEventListener(
  "error",
  (event) => {
    const target = event.target;
    if (
      target instanceof HTMLScriptElement &&
      (target.type === "module" || target.src.includes("/assets/"))
    ) {
      reloadForStaleAssets();
    }
  },
  true,
);

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const message =
    typeof reason === "string"
      ? reason
      : reason?.message || reason?.toString?.() || "";

  if (
    /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|MIME type/i.test(
      message,
    )
  ) {
    event.preventDefault();
    reloadForStaleAssets();
  }
});

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // registerType is autoUpdate — apply immediately instead of waiting for user action.
    updateSW(true);
  },
  onOfflineReady() {
    toast.success("Offline support is ready.", {
      id: "app-offline-ready",
    });
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <ApolloProvider client={client}>
        <BrowserRouter>
          <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: "#fff",
                  color: "#1f2937",
                  padding: "16px",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.12)",
                },
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </ApolloProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
