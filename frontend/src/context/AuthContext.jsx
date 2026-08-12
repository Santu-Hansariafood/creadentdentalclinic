import { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useMutation, useQuery, useApolloClient } from "@apollo/client";
import { LOGIN, REGISTER } from "../graphql/mutations";
import { GET_ME } from "../graphql/queries";

const AuthContext = createContext();

const AUTH_KEYS = ["token", "user"];

const clearNonAuthCache = () => {
  try {
    const toKeep = {};
    AUTH_KEYS.forEach((k) => {
      const v = localStorage.getItem(k);
      if (v) toKeep[k] = v;
    });
    localStorage.clear();
    Object.entries(toKeep).forEach(([k, v]) => localStorage.setItem(k, v));
    sessionStorage.clear();
  } catch (e) {
    console.warn("Cache clear failed:", e);
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

const isAuthError = (error) => {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  const gqlMsgs = (error.graphQLErrors || []).map((e) =>
    (e.message || "").toLowerCase()
  );
  const allMsgs = [msg, ...gqlMsgs];
  return allMsgs.some(
    (m) =>
      m.includes("not authenticated") ||
      m.includes("unauthorized") ||
      m.includes("not authorized") ||
      m.includes("invalid token") ||
      m.includes("token failed") ||
      m.includes("no token")
  );
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const apolloClient = useApolloClient();

  const [loginMutation] = useMutation(LOGIN);
  const [registerMutation] = useMutation(REGISTER);

  useEffect(() => {
    const beforeUnloadHandler = () => {
      clearNonAuthCache();
    };
    window.addEventListener("beforeunload", beforeUnloadHandler);
    return () => window.removeEventListener("beforeunload", beforeUnloadHandler);
  }, [apolloClient]);

  const {
    data: meData,
    loading: meLoading,
    error: meError,
  } = useQuery(GET_ME, {
    skip: !localStorage.getItem("token"),
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (meData?.me) {
      setUser(meData.me);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(meData.me));
      setLoading(false);
      return;
    }

    if (meError) {
      console.warn("GET_ME error:", meError);
      if (isAuthError(meError)) {
        const existingUser = localStorage.getItem("user");
        const existingToken = localStorage.getItem("token");
        if (!existingUser || !existingToken) {
          logout();
        }
      }
    }

    if (!meLoading) {
      setLoading(false);
    }
  }, [meData, meError, meLoading]);

  const login = async (phone, password, rememberMe = true) => {
    try {
      const variables = {
        phone: phone || "",
        password: password || "",
      };

      const { data } = await loginMutation({ variables });

      if (data?.login) {
        const { token, user: userData } = data.login;
        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", token);
        if (rememberMe) {
          localStorage.setItem("rememberedPhone", userData.phone || phone);
        } else {
          localStorage.removeItem("rememberedPhone");
        }
        try {
          await apolloClient.resetStore();
        } catch (_) {}
        toast.success(`Welcome back, ${userData.name}!`);
        return { success: true };
      }
    } catch (error) {
      console.error("Login mutation error:", error);
      console.error("   Error details:", {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
        stack: error.stack,
      });
      toast.error(error.message || "Login failed");
      return { success: false };
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await registerMutation({
        variables: { ...userData },
      });

      if (data?.register) {
        const { token, user: newUser } = data.register;
        setUser(newUser);
        setIsAuthenticated(true);
        setLoading(false);
        localStorage.setItem("user", JSON.stringify(newUser));
        localStorage.setItem("token", token);
        try {
          await apolloClient.resetStore();
        } catch (_) {}
        toast.success("Registration successful!");
        return { success: true };
      }
    } catch (error) {
      toast.error(error.message || "Registration failed");
      return { success: false };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);

    const rememberedPhone = localStorage.getItem("rememberedPhone");
    localStorage.clear();
    sessionStorage.clear();
    if (rememberedPhone) {
      localStorage.setItem("rememberedPhone", rememberedPhone);
    }

    apolloClient.clearStore().catch(() => {});

    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
