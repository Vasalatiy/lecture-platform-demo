import React, { createContext, useContext, useEffect } from "react";
import { useAuth } from "@clerk/expo";
import {
  getGetMeQueryKey,
  setAuthTokenGetter,
  useGetMe,
} from "@workspace/api-client-react";

export type UserRole = "admin" | "viewer";

export interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAdmin: false,
  refetch: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  const { data, isLoading, refetch } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!isSignedIn,
      retry: 1,
    },
  });

  const user = data
    ? {
        id: data.id,
        clerkId: data.clerkId,
        email: data.email,
        role: data.role as UserRole,
        createdAt: data.createdAt,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading && !!isSignedIn,
        isAdmin: user?.role === "admin",
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(AuthContext);
}
