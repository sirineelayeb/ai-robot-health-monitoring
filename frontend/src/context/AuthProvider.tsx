import  { useReducer } from "react";
import type { ReactNode } from "react";
import { AuthContext, initialState } from "./AuthContext";

type AuthAction =
  | { type: "LOGIN"; payload: typeof initialState }
  | { type: "LOGOUT" };

const authReducer = (state: typeof initialState, action: AuthAction) => {
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
  const [state, dispatch] = useReducer(authReducer, initialState);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};
