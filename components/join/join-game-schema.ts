import * as z from "zod";

export const joinFormSchema = z.object({
  gameCode: z
    .string()
    .min(5, "Game code must be 5 characters")
    .max(5, "Game code must be 5 characters")
    .regex(/^[A-Z0-9]+$/, "Game code must contain only letters and numbers"),
  playerName: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters"),
});

export type JoinFormValues = z.infer<typeof joinFormSchema>;
