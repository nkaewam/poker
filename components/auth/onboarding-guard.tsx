"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/use-auth";
import { useUserNickname } from "@/lib/api/hooks";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isPending } = useAuth();
  const { data: nicknameData, isPending: isNicknamePending } =
    useUserNickname();

  useEffect(() => {
    // Don't redirect if still loading or on auth/onboarding pages
    if (isPending || isNicknamePending) {
      return;
    }

    // If user is authenticated
    if (user) {
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
  }, [user, nicknameData, pathname, router, isPending, isNicknamePending]);

  // Show loading state while checking
  if (isPending || isNicknamePending) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}
