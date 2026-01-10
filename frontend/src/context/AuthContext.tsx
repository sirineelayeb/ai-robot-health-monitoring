import { createContext } from "react";
import type { User } from "../types/user";

export interface AuthState {
  user: User | null;
  accessToken: string | null;
}

export type AuthAction =
  | { type: "LOGIN"; payload: AuthState }
  | { type: "LOGOUT" };

export const initialState: AuthState = {
  user: null,
  accessToken: null,
};

// Only export the context object
export const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
} | null>(null);