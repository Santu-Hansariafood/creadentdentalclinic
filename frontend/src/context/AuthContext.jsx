import { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useMutation, useQuery, useApolloClient } from "@apollo/client";
import { LOGIN, REGISTER } from "../graphql/mutations";
import { GET_ME } from "../graphql/queries";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const apolloClient = useApolloClient();

  const [loginMutation] = useMutation(LOGIN);
  const [registerMutation] = useMutation(REGISTER);

  const {
    data: meData,
    loading: meLoading,
    error: meError,
  } = useQuery(GET_ME, {
    skip: !localStorage.getItem("token"),
  });

  useEffect(() => {
    if (meData?.me) {
      setUser(meData.me);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(meData.me));
    } else if (meError) {
      logout();
    }
    setLoading(meLoading);
  }, [meData, meError, meLoading]);

  const login = async (phone, password) => {
    
    try {
      const variables = {
        phone: phone || "",
        password: password || ""
      };
      
      
      const { data } = await loginMutation({ variables });

      if (data?.login) {
        const { token, user: userData } = data.login;
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", token);
        toast.success(`Welcome back, ${userData.name}!`);
        return { success: true };
      }
    } catch (error) {
      console.error("Login mutation error:", error);
      console.error("   Error details:", {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
        stack: error.stack
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
        localStorage.setItem("user", JSON.stringify(newUser));
        localStorage.setItem("token", token);
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
    
    localStorage.clear();
    
    sessionStorage.clear();
    
    apolloClient.resetStore();
    
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
