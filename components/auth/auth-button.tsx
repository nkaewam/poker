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
import { ColorPicker } from "@/components/ui/color-picker";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";
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
  iconColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

// Pattern type preview component
function PatternPreview({
  type,
  size = 24,
  className,
}: {
  type: IconPattern["type"] | "auto";
  size?: number;
  className?: string;
}) {
  if (type === "auto") {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-muted-foreground">Auto</span>
      </div>
    );
  }

  const colors = ["#3b82f6", "#60a5fa", "#93c5fd"];
  const patternSize = size / 3;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      {type === "grid" && (
        <>
          <rect
            x="0"
            y="0"
            width={patternSize}
            height={patternSize}
            fill={colors[0]}
          />
          <rect
            x={patternSize}
            y="0"
            width={patternSize}
            height={patternSize}
            fill={colors[1]}
          />
          <rect
            x={patternSize * 2}
            y="0"
            width={patternSize}
            height={patternSize}
            fill={colors[0]}
          />
          <rect
            x="0"
            y={patternSize}
            width={patternSize}
            height={patternSize}
            fill={colors[1]}
          />
          <rect
            x={patternSize}
            y={patternSize}
            width={patternSize}
            height={patternSize}
            fill={colors[0]}
          />
          <rect
            x={patternSize * 2}
            y={patternSize}
            width={patternSize}
            height={patternSize}
            fill={colors[1]}
          />
          <rect
            x="0"
            y={patternSize * 2}
            width={patternSize}
            height={patternSize}
            fill={colors[0]}
          />
          <rect
            x={patternSize}
            y={patternSize * 2}
            width={patternSize}
            height={patternSize}
            fill={colors[1]}
          />
          <rect
            x={patternSize * 2}
            y={patternSize * 2}
            width={patternSize}
            height={patternSize}
            fill={colors[0]}
          />
        </>
      )}
      {type === "dots" && (
        <>
          <circle
            cx={patternSize}
            cy={patternSize}
            r={patternSize * 0.3}
            fill={colors[0]}
          />
          <circle
            cx={patternSize * 2}
            cy={patternSize * 2}
            r={patternSize * 0.3}
            fill={colors[1]}
          />
        </>
      )}
      {type === "lines" && (
        <>
          <line
            x1="0"
            y1="0"
            x2={size}
            y2={size}
            stroke={colors[0]}
            strokeWidth={2}
          />
        </>
      )}
      {type === "shapes" && (
        <>
          <circle
            cx={patternSize}
            cy={patternSize}
            r={patternSize * 0.4}
            fill={colors[0]}
          />
          <rect
            x={patternSize * 1.5}
            y={patternSize * 1.5}
            width={patternSize * 0.8}
            height={patternSize * 0.8}
            fill={colors[1]}
          />
        </>
      )}
    </svg>
  );
}

// Border shape preview component
function BorderShapePreview({
  shape,
  size = 24,
  className,
}: {
  shape: BorderShape | "auto";
  size?: number;
  className?: string;
}) {
  if (shape === "auto") {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-muted-foreground">Auto</span>
      </div>
    );
  }

  const radius = size / 2 - 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const points = 32;
  const amplitude = 2;

  const generatePath = () => {
    const pathParts: string[] = [];
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      let radiusOffset = 0;

      switch (shape) {
        case "wavy":
          radiusOffset = Math.sin(angle * 4) * amplitude;
          break;
        case "zigzag":
          radiusOffset = (Math.sin(angle * 8) > 0 ? 1 : -1) * amplitude;
          break;
        case "scalloped":
          radiusOffset = Math.max(0, Math.cos(angle * 6)) * amplitude;
          break;
        case "spiked":
          radiusOffset = Math.max(0, Math.sin(angle * 8)) * amplitude * 1.5;
          break;
        case "rounded":
          radiusOffset = Math.max(0, Math.sin(angle * 6)) * amplitude * 0.8;
          break;
        case "smooth":
          radiusOffset = 0;
          break;
      }

      const r = radius + radiusOffset;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      if (i === 0) {
        pathParts.push(`M ${x} ${y}`);
      } else {
        pathParts.push(`L ${x} ${y}`);
      }
    }
    pathParts.push("Z");
    return pathParts.join(" ");
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      <path
        d={generatePath()}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="text-foreground"
      />
    </svg>
  );
}

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
      iconColor: iconPreferences?.iconColor || undefined,
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
        iconColor: iconPreferences?.iconColor || undefined,
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
          iconColor: data.iconColor || undefined,
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
                  iconColor: iconPreferences?.iconColor || undefined,
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
                    previewIconColor={
                      editUserForm.watch("iconColor") || undefined
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
                      <FormControl>
                        <ButtonGroup>
                          {(["grid", "dots", "lines", "shapes"] as const).map(
                            (type) => {
                              const isSelected = field.value === type;
                              return (
                                <Button
                                  key={type}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => field.onChange(type)}
                                  className={cn(
                                    "flex flex-col items-center gap-1 h-auto py-2 px-3",
                                    isSelected && "bg-primary/40"
                                  )}
                                >
                                  <PatternPreview type={type} size={20} />
                                  <span className="text-xs capitalize">
                                    {type}
                                  </span>
                                </Button>
                              );
                            }
                          )}
                        </ButtonGroup>
                      </FormControl>
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
                      <FormControl>
                        <ButtonGroup className="flex-wrap">
                          {(
                            [
                              "wavy",
                              "zigzag",
                              "scalloped",
                              "spiked",
                              "rounded",
                              "smooth",
                            ] as const
                          ).map((shape) => {
                            const isSelected = field.value === shape;
                            return (
                              <Button
                                key={shape}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => field.onChange(shape)}
                                className={cn(
                                  "flex flex-col items-center gap-1 h-auto py-2 px-3",
                                  isSelected && "bg-primary/40"
                                )}
                              >
                                <BorderShapePreview shape={shape} size={20} />
                                <span className="text-xs capitalize">
                                  {shape}
                                </span>
                              </Button>
                            );
                          })}
                        </ButtonGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editUserForm.control}
                  name="iconColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon Color</FormLabel>
                      <FormControl>
                        <ColorPicker
                          value={field.value}
                          onChange={field.onChange}
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
