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
    toast.info(
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="font-semibold">Update available</p>
          <p className="text-sm text-slate-600">
            Refresh to load the latest clinic app version.
          </p>
        </div>
        <button
          type="button"
          className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white"
          onClick={() => {
            // #region debug-point A:sw-apply-update
            fetch("http://127.0.0.1:7777/event", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: "prod-reload-loop",
                runId: "pre-fix",
                hypothesisId: "A",
                location: "src/main.jsx:53",
                msg: "[DEBUG] User accepted service worker refresh",
                data: {
                  href: window.location.href,
                },
                ts: Date.now(),
              }),
            }).catch(() => {});
            // #endregion
            updateSW(true);
          }}
        >
          Refresh
        </button>
      </div>,
      {
        autoClose: false,
        closeOnClick: false,
        toastId: "app-update-ready",
      },
    );
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
