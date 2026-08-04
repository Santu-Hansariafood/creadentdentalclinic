import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./context/AuthContext";
import toast from "react-hot-toast";
import { ApolloProvider } from "@apollo/client";
import client from "./apolloClient";
import { HelmetProvider } from "react-helmet-async";
import { ToastContainer } from "react-toastify";
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

// #region debug-point B:main-startup
fetch("http://127.0.0.1:7777/event", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sessionId: "prod-reload-loop",
    runId: "pre-fix",
    hypothesisId: "B",
    location: "src/main.jsx:13",
    msg: "[DEBUG] Main entry evaluated",
    data: {
      href: window.location.href,
      readyState: document.readyState,
    },
    ts: Date.now(),
  }),
}).catch(() => {});
// #endregion

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // #region debug-point A:sw-need-refresh
    fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "prod-reload-loop",
        runId: "pre-fix",
        hypothesisId: "A",
        location: "src/main.jsx:31",
        msg: "[DEBUG] Service worker requested refresh",
        data: {
          href: window.location.href,
          visibilityState: document.visibilityState,
        },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    // registerType is autoUpdate — apply immediately instead of waiting for user action.
    updateSW(true);
  },
  onOfflineReady() {
    // #region debug-point A:sw-offline-ready
    fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "prod-reload-loop",
        runId: "pre-fix",
        hypothesisId: "A",
        location: "src/main.jsx:73",
        msg: "[DEBUG] Service worker offline ready",
        data: {
          href: window.location.href,
        },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    toast.success("Offline support is ready.", {
      toastId: "app-offline-ready",
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
            <ToastContainer
              position="top-right"
              autoClose={3000}
              newestOnTop
              pauseOnFocusLoss={false}
              limit={4}
              theme="light"
              toastStyle={{
                background: "#fff",
                color: "#1f2937",
                padding: "16px",
                borderRadius: "12px",
                boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.12)",
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </ApolloProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
