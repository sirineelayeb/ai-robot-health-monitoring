import { createContext } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
}

type AuthAction =
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
