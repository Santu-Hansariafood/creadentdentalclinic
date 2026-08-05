import axios from "axios";

const api = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("[Request Error]:", error);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error(`[Response Error]:`, error.response?.data || error.message);

    if (error.response?.status === 401) {
      // #region debug-point D:auth-redirect
      fetch("http://127.0.0.1:7777/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "prod-reload-loop",
          runId: "pre-fix",
          hypothesisId: "D",
          location: "src/api/axios.js:27",
          msg: "[DEBUG] Redirecting to login after 401 response",
          data: {
            href: window.location.href,
            status: error.response?.status,
            requestUrl: error.config?.url,
          },
          ts: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
