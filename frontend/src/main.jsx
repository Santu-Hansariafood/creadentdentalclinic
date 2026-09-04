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

registerSW({
  immediate: true,
  onNeedRefresh() {
    toast("A new version is available. Refresh when convenient.", {
      duration: 8000,
      id: "pwa-update-available",
    });
  },
  onOfflineReady() {
    toast.success("Offline support is ready.", {
      toastId: "app-offline-ready",
    });
  },
});

document.addEventListener(
  "wheel",
  (e) => {
    const active = document.activeElement;

    if (active instanceof HTMLInputElement && active.type === "number") {
      e.preventDefault();
    }
  },
  { passive: false },
);

document.addEventListener("keydown", (e) => {
  const active = document.activeElement;

  if (
    active instanceof HTMLInputElement &&
    active.type === "number" &&
    (e.key === "ArrowUp" || e.key === "ArrowDown")
  ) {
    e.preventDefault();
  }
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
