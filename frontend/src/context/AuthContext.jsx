import { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useMutation, useQuery, useApolloClient } from "@apollo/client";
import { LOGIN, REGISTER } from "../graphql/mutations";
import { GET_ME } from "../graphql/queries";

const AuthContext = createContext();

const AUTH_KEYS = ["token", "user"];

const DEMO_CONFIG = {
  phone: (import.meta.env.VITE_DEMO_PATIENT_PHONE || "7029481930")
    .toString()
    .trim(),
  password: (import.meta.env.VITE_DEMO_PATIENT_PASSWORD || "Demo@123").trim(),
  name: import.meta.env.VITE_DEMO_PATIENT_NAME || "Demo Patient",
  email: import.meta.env.VITE_DEMO_PATIENT_EMAIL || "demo.patient@creadent.com",
};

export const getDemoPatientInfo = () => ({ ...DEMO_CONFIG });

const isDemoPhone = (phone = "") => {
  const normalized = phone.toString().replace(/\D/g, "");
  const demoNormalized = DEMO_CONFIG.phone.toString().replace(/\D/g, "");
  return normalized === demoNormalized && normalized.length > 0;
};

const createDemoPatientUser = () => {
  const phone = DEMO_CONFIG.phone;
  const demoUser = {
    id: "demo-patient-9999",
    userId: "demo-patient-user-9999",
    phone,
    name: DEMO_CONFIG.name,
    email: DEMO_CONFIG.email,
    role: "patient",
    verified: true,
    isDemo: true,
    createdAt: new Date().toISOString(),
  };
  return demoUser;
};

const clearNonAuthCache = () => {
  try {
    const toKeep = {};
    AUTH_KEYS.forEach((k) => {
      const v = localStorage.getItem(k);
      if (v) toKeep[k] = v;
    });
    const rememberedPhone = localStorage.getItem("rememberedPhone");
    if (rememberedPhone) toKeep["rememberedPhone"] = rememberedPhone;
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
      m.includes("no token") ||
      m.includes("user not found")
  );
};

export const AuthProvider = ({ children }) => {
  const apolloClient = useApolloClient();

  const initialToken =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const initialUserStr =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  let initialUser = null;
  if (initialUserStr) {
    try {
      initialUser = JSON.parse(initialUserStr);
    } catch (_) {
      initialUser = null;
    }
  }

  const [user, setUser] = useState(initialUser);
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(initialToken && initialUser)
  );
  const [loading, setLoading] = useState(!initialToken || !initialUser);

  const [loginMutation] = useMutation(LOGIN);
  const [registerMutation] = useMutation(REGISTER);

  useEffect(() => {
    const beforeUnloadHandler = () => {
      clearNonAuthCache();
    };
    window.addEventListener("beforeunload", beforeUnloadHandler);
    return () => window.removeEventListener("beforeunload", beforeUnloadHandler);
  }, []);

  const isDemoSession = initialUser?.isDemo || initialToken === "demo-token";

  const {
    data: meData,
    loading: meLoading,
    error: meError,
  } = useQuery(GET_ME, {
    skip: !initialToken || isDemoSession,
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (meData?.me) {
      setUser(meData.me);
      setIsAuthenticated(true);
      try {
        localStorage.setItem("user", JSON.stringify(meData.me));
      } catch (_) {}
      setLoading(false);
      return;
    }

    if (meError) {
      console.warn("GET_ME error:", meError);
      if (isAuthError(meError)) {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");
        if (!storedUser || !storedToken) {
          logout();
          return;
        }
      }
    }

    if (!meLoading) {
      setLoading(false);
    }
  }, [meData, meError, meLoading, isDemoSession]);

  const login = async (phone, password, rememberMe = true) => {
    const cleanPhone = (phone || "").toString().trim();
    const cleanPassword = (password || "").toString();

    if (isDemoPhone(cleanPhone)) {
      if (cleanPassword !== DEMO_CONFIG.password) {
        toast.error("Invalid demo password");
        return { success: false };
      }
      const demoUser = createDemoPatientUser();
      const demoToken = "demo-token";
      setUser(demoUser);
      setIsAuthenticated(true);
      setLoading(false);
      try {
        localStorage.setItem("user", JSON.stringify(demoUser));
        localStorage.setItem("token", demoToken);
        if (rememberMe) {
          localStorage.setItem(
            "rememberedPhone",
            demoUser.phone || cleanPhone
          );
        } else {
          localStorage.removeItem("rememberedPhone");
        }
      } catch (_) {}
      toast.success(`Welcome back, ${demoUser.name}!`);
      return { success: true };
    }

    try {
      const variables = {
        phone: cleanPhone,
        password: cleanPassword,
      };

      const { data } = await loginMutation({ variables });

      if (data?.login) {
        const { token, user: userData } = data.login;
        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false);
        try {
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("token", token);
          if (rememberMe) {
            localStorage.setItem(
              "rememberedPhone",
              userData.phone || cleanPhone
            );
          } else {
            localStorage.removeItem("rememberedPhone");
          }
        } catch (_) {}
        toast.success(`Welcome back, ${userData.name}!`);
        return { success: true };
      }
      toast.error("Login failed: invalid response");
      return { success: false };
    } catch (error) {
      console.error("Login mutation error:", error);
      const msg =
        error?.graphQLErrors?.[0]?.message ||
        error?.message ||
        "Login failed";
      toast.error(msg);
      return { success: false };
    }
  };

  const register = async (userData) => {
    try {
      const email = userData.email?.trim()?.toLowerCase();
      const variables = {
        ...userData,
        email,
      };
      const { data } = await registerMutation({
        variables,
      });

      if (data?.register) {
        const { token, user: newUser } = data.register;
        if (token && newUser) {
          setUser(newUser);
          setIsAuthenticated(true);
          setLoading(false);
          try {
            localStorage.setItem("user", JSON.stringify(newUser));
            localStorage.setItem("token", token);
          } catch (_) {}
        }
        toast.success("Registration successful!");
        return { success: true, user: newUser };
      }
      toast.error("Registration failed: invalid response");
      return { success: false };
    } catch (error) {
      toast.error(error?.message || "Registration failed");
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
      try {
        localStorage.setItem("rememberedPhone", rememberedPhone);
      } catch (_) {}
    }

    apolloClient.clearStore().catch(() => {});

    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        demoPatient: getDemoPatientInfo(),
        isDemoUser: Boolean(user?.isDemo),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
