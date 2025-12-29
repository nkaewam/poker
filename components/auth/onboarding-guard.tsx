"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@better-auth/react";
import { useUserNickname } from "@/lib/api/hooks";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending: isAuthPending } = useAuth();
  const { data: nicknameData, isPending: isNicknamePending } = useUserNickname();

  useEffect(() => {
    // Don't redirect if still loading or on auth/onboarding pages
    if (isAuthPending || isNicknamePending) {
      return;
    }

    // If user is authenticated
    if (session?.user) {
      // Check if they need onboarding
      if (!nicknameData?.nickname && pathname !== "/onboarding") {
        router.push("/onboarding");
        return;
      }

      // If they have a nickname but are on onboarding, redirect to home
      if (nicknameData?.nickname && pathname === "/onboarding") {
        router.push("/");
        return;
      }
    }
  }, [session, nicknameData, pathname, router, isAuthPending, isNicknamePending]);

  // Show loading state while checking
  if (isAuthPending || isNicknamePending) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}
