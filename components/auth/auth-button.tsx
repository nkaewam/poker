"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/components/auth/auth-provider";
import { LogIn, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function AuthButton() {
  const session = authClient.useSession();
  const router = useRouter();

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  if (session.isPending) {
    return (
      <Button variant="ghost" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (session.data?.user) {
    const user = session.data.user;
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          {user.image && (
            <img
              src={user.image}
              alt={user.name || "User"}
              className="w-6 h-6 rounded-full"
            />
          )}
          <span>{user.name || user.email}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="gap-2"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignIn}
      className="gap-2"
    >
      <LogIn className="size-4" />
      <span className="hidden sm:inline">Sign In</span>
    </Button>
  );
}
