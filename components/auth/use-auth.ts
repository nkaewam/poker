"use client";

import { authClient } from "@/components/auth/auth-provider";

export function useAuth() {
  const session = authClient.useSession();

  return {
    session,
    isAuthenticated: !!session.data?.user,
    user: session.data?.user ?? null,
    isPending: session.isPending,
  };
}
