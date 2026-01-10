import { useContext } from "react";
import { AuthContext } from "./AuthContext";

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used inside an AuthContextProvider");
  }

  return context;
};

// Helper hooks for role checking
export const useIsAdmin = (): boolean => {
  const { state } = useAuthContext();
  return state.user?.role === "admin";
};

export const useIsEngineer = (): boolean => {
  const { state } = useAuthContext();
  return state.user?.role === "maintenance_engineer";
};

// Hook to get current user
export const useCurrentUser = () => {
  const { state } = useAuthContext();
  return state.user;
};

// Hook to check if user is logged in
export const useIsAuthenticated = (): boolean => {
  const { state } = useAuthContext();
  return !!(state.user && state.accessToken);
};