"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/components/auth/auth-provider";
import { useUserNickname, useUpdateUserNickname } from "@/lib/api/hooks";
import { LogIn, LogOut, User, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Spinner } from "@/components/ui/spinner";

const nicknameSchema = z.object({
  nickname: z
    .string()
    .min(1, "Nickname is required")
    .max(50, "Nickname must be less than 50 characters")
    .trim(),
});

type NicknameFormValues = z.infer<typeof nicknameSchema>;

export function AuthButton() {
  const session = authClient.useSession();
  const router = useRouter();
  const { data: nicknameData } = useUserNickname();
  const updateNickname = useUpdateUserNickname();
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);

  const form = useForm<NicknameFormValues>({
    resolver: zodResolver(nicknameSchema),
    defaultValues: {
      nickname: nicknameData?.nickname || "",
    },
  });

  // Update form when nickname data changes
  useEffect(() => {
    if (nicknameData?.nickname) {
      form.reset({ nickname: nicknameData.nickname });
    }
  }, [nicknameData?.nickname, form]);

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

  const handleRenameSubmit = async (data: NicknameFormValues) => {
    try {
      await updateNickname.mutateAsync(data.nickname.trim());
      setIsRenameDialogOpen(false);
    } catch (error) {
      console.error("Failed to update nickname:", error);
      form.setError("nickname", {
        type: "manual",
        message: error instanceof Error ? error.message : "Failed to update nickname",
      });
    }
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
    const displayName = nicknameData?.nickname || user.name || user.email;

    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="hidden sm:flex items-center gap-2">
                {user.image && (
                  <img
                    src={user.image}
                    alt={displayName}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="text-sm">{displayName}</span>
              </div>
              <div className="sm:hidden">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={displayName}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <User className="size-4" />
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                form.reset({ nickname: nicknameData?.nickname || "" });
                setIsRenameDialogOpen(true);
              }}
            >
              <Pencil className="mr-2 size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} variant="destructive">
              <LogOut className="mr-2 size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Preferred Nickname</DialogTitle>
              <DialogDescription>
                Update your preferred nickname for poker games
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleRenameSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Nickname</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your nickname"
                          autoFocus
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRenameDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateNickname.isPending}
                  >
                    {updateNickname.isPending && <Spinner className="mr-2" />}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </>
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
