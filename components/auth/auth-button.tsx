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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/components/auth/auth-provider";
import {
  useUserNickname,
  useUpdateUserNickname,
  useUserIconPreferences,
  useUpdateUserIconPreferences,
} from "@/lib/api/hooks";
import { UserIcon } from "@/components/auth/user-icon";
import { LogIn, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Spinner } from "@/components/ui/spinner";
import type { IconPattern } from "@/lib/utils/icon-pattern";
import type { BorderShape } from "@/components/game/player-icon";

const editUserSchema = z.object({
  nickname: z
    .string()
    .min(1, "Nickname is required")
    .max(50, "Nickname must be less than 50 characters")
    .trim(),
  patternType: z.enum(["grid", "dots", "lines", "shapes"]).optional(),
  borderShape: z
    .enum(["wavy", "zigzag", "scalloped", "spiked", "rounded", "smooth"])
    .optional(),
  iconSeed: z.string().optional(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

export function AuthButton() {
  const session = authClient.useSession();
  const router = useRouter();
  const { data: nicknameData } = useUserNickname();
  const { data: iconPreferences } = useUserIconPreferences();
  const updateNickname = useUpdateUserNickname();
  const updateIconPreferences = useUpdateUserIconPreferences();
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);

  const editUserForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      nickname: nicknameData?.nickname || "",
      patternType:
        (iconPreferences?.patternType as IconPattern["type"]) || undefined,
      borderShape: (iconPreferences?.borderShape as BorderShape) || undefined,
      iconSeed: iconPreferences?.iconSeed || undefined,
    },
  });

  // Update form when data changes
  useEffect(() => {
    if (nicknameData?.nickname || iconPreferences) {
      editUserForm.reset({
        nickname: nicknameData?.nickname || "",
        patternType:
          (iconPreferences?.patternType as IconPattern["type"]) || undefined,
        borderShape: (iconPreferences?.borderShape as BorderShape) || undefined,
        iconSeed: iconPreferences?.iconSeed || undefined,
      });
    }
  }, [nicknameData?.nickname, iconPreferences, editUserForm]);

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

  const handleEditUserSubmit = async (data: EditUserFormValues) => {
    try {
      // Update both nickname and icon preferences
      await Promise.all([
        updateNickname.mutateAsync(data.nickname.trim()),
        updateIconPreferences.mutateAsync({
          patternType: data.patternType,
          borderShape: data.borderShape,
          iconSeed: data.iconSeed || undefined,
        }),
      ]);
      setIsEditUserDialogOpen(false);
    } catch (error) {
      console.error("Failed to update user:", error);
      if (error instanceof Error && error.message.includes("nickname")) {
        editUserForm.setError("nickname", {
          type: "manual",
          message: error.message,
        });
      }
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
            <Button variant="ghost" size="sm" className="gap-2 py-2">
              <div className="flex items-center gap-2">
                <UserIcon userId={user.id} size={30} />
                <span className="text-sm leading-none hidden sm:block">
                  {displayName}
                </span>
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
                editUserForm.reset({
                  nickname: nicknameData?.nickname || "",
                  patternType:
                    (iconPreferences?.patternType as IconPattern["type"]) ||
                    undefined,
                  borderShape:
                    (iconPreferences?.borderShape as BorderShape) || undefined,
                  iconSeed: iconPreferences?.iconSeed || undefined,
                });
                setIsEditUserDialogOpen(true);
              }}
            >
              <Settings className="mr-2 size-4" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} variant="destructive">
              <LogOut className="mr-2 size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog
          open={isEditUserDialogOpen}
          onOpenChange={setIsEditUserDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update your nickname and customize your icon
              </DialogDescription>
            </DialogHeader>
            <Form {...editUserForm}>
              <form
                onSubmit={editUserForm.handleSubmit(handleEditUserSubmit)}
                className="space-y-6"
              >
                <div className="flex items-center justify-center py-4">
                  <UserIcon
                    userId={session.data.user.id}
                    size={80}
                    previewPatternType={
                      editUserForm.watch("patternType") || undefined
                    }
                    previewBorderShape={
                      editUserForm.watch("borderShape") || undefined
                    }
                    previewIconSeed={
                      editUserForm.watch("iconSeed") || undefined
                    }
                  />
                </div>
                <FormField
                  control={editUserForm.control}
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
                <FormField
                  control={editUserForm.control}
                  name="patternType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pattern Type</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "auto" ? undefined : value)
                        }
                        value={field.value || "auto"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Auto (random)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="auto">Auto (random)</SelectItem>
                          <SelectItem value="grid">Grid</SelectItem>
                          <SelectItem value="dots">Dots</SelectItem>
                          <SelectItem value="lines">Lines</SelectItem>
                          <SelectItem value="shapes">Shapes</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editUserForm.control}
                  name="borderShape"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Border Shape</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "auto" ? undefined : value)
                        }
                        value={field.value || "auto"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Auto (random)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="auto">Auto (random)</SelectItem>
                          <SelectItem value="wavy">Wavy</SelectItem>
                          <SelectItem value="zigzag">Zigzag</SelectItem>
                          <SelectItem value="scalloped">Scalloped</SelectItem>
                          <SelectItem value="spiked">Spiked</SelectItem>
                          <SelectItem value="rounded">Rounded</SelectItem>
                          <SelectItem value="smooth">Smooth</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editUserForm.control}
                  name="iconSeed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon Seed (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Leave empty to use user ID"
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
                    onClick={() => setIsEditUserDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      updateNickname.isPending ||
                      updateIconPreferences.isPending
                    }
                  >
                    {(updateNickname.isPending ||
                      updateIconPreferences.isPending) && (
                      <Spinner className="mr-2" />
                    )}
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
