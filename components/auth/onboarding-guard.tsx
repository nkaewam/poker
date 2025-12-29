"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/components/auth/auth-provider";
import { useUserNickname } from "@/lib/api/hooks";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = authClient.useSession();
  const { data: nicknameData, isPending: isNicknamePending } =
    useUserNickname();

  useEffect(() => {
    // Don't redirect if still loading or on auth/onboarding pages
    if (session.isPending || isNicknamePending) {
      return;
    }

    // If user is authenticated
    if (session.data?.user) {
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
  }, [session, nicknameData, pathname, router, isNicknamePending]);

  // Show loading state while checking
  if (session.isPending || isNicknamePending) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}
