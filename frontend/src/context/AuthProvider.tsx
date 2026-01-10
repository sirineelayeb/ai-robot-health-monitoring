import { useReducer, useEffect } from "react";
import type { ReactNode } from "react";
import { AuthContext, initialState, type AuthState, type AuthAction } from "./AuthContext";

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN":
      return action.payload;
    case "LOGOUT":
      return { user: null, accessToken: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage if available
  const getInitialState = (): AuthState => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");
      
      if (storedUser && storedToken) {
        return {
          user: JSON.parse(storedUser),
          accessToken: storedToken
        };
      }
    } catch (error) {
      console.error("Failed to parse stored auth data:", error);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
    return initialState;
  };

  const [state, dispatch] = useReducer(authReducer, initialState, getInitialState);

  // Sync state changes to localStorage
  useEffect(() => {
    if (state.user && state.accessToken) {
      localStorage.setItem("user", JSON.stringify(state.user));
      localStorage.setItem("token", state.accessToken);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, [state.user, state.accessToken]);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};