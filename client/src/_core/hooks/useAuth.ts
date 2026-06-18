import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from localStorage on mount
  useEffect(() => {
    try {
      const storedUserData = localStorage.getItem("user-data");
      if (storedUserData) {
        const user = JSON.parse(storedUserData);
        console.log("[useAuth] User data loaded from localStorage:", user);
        setUserData(user);
      }
    } catch (error) {
      console.error("[useAuth] Failed to parse user data from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fallback: try auth.me query if no user data in localStorage
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !userData && !isLoading, // Only if no user data from localStorage
    retry: false, // Don't retry on error to prevent infinite loops
    retryDelay: 1000,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      // Clear token and user data from localStorage
      localStorage.removeItem("auth-token");
      localStorage.removeItem("user-data");
      setUserData(null);
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      // Always clear token and user data on logout
      localStorage.removeItem("auth-token");
      localStorage.removeItem("user-data");
      setUserData(null);
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    // Use userData from localStorage if available, otherwise use meQuery data
    const currentUser = userData || meQuery.data;
    const isAuth = Boolean(currentUser);
    
    console.log("[useAuth] State update:", {
      userData: !!userData,
      meQueryData: !!meQuery.data,
      currentUser: !!currentUser,
      isLoading,
      meQueryIsLoading: meQuery.isLoading,
      isAuthenticated: isAuth,
    });
    
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(currentUser)
    );
    return {
      user: currentUser ?? null,
      loading: isLoading || meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: isAuth,
    };
  }, [
    userData,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    isLoading,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (state.loading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    state.loading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
