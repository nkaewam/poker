"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthButton } from "@/components/auth/auth-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/components/auth/auth-provider";

const nicknameSchema = z.object({
  nickname: z
    .string()
    .min(1, "Nickname is required")
    .max(50, "Nickname must be less than 50 characters")
    .trim(),
});

type NicknameFormValues = z.infer<typeof nicknameSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const session = authClient.useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NicknameFormValues>({
    resolver: zodResolver(nicknameSchema),
    defaultValues: {
      nickname: "",
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!session.isPending && !session.data?.user) {
      router.push("/");
    }
  }, [session, router]);

  const handleSubmit = async (data: NicknameFormValues) => {
    if (!session.data?.user) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/user/nickname", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname: data.nickname.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to save nickname");
      }

      router.push("/");
    } catch (error) {
      console.error("Failed to save nickname:", error);
      form.setError("nickname", {
        type: "manual",
        message: error instanceof Error ? error.message : "Failed to save nickname",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (session.isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Spinner />
      </div>
    );
  }

  if (!session.data?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex justify-end p-4">
        <AuthButton />
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Welcome!</h1>
          <p className="text-muted-foreground">
            Let's set up your preferred nickname for poker games
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
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
                      className="text-center"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting && <Spinner className="mr-2" />}
              {isSubmitting ? "Saving..." : "Continue"}
            </Button>
          </form>
        </Form>
        </div>
      </div>
    </div>
  );
}
