"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthFormState = { error?: string; success?: string };

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

/** Only follow `next` back into the portal — never an open redirect. */
function safeNext(next: string | undefined) {
  if (next && next.startsWith("/portal") && !next.startsWith("//")) return next;
  return "/portal";
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return { error: "Enter your email and password." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Sign-in isn't configured on this deployment yet." };

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    // Wrong email and wrong password get the same message, so the form
    // doesn't reveal which emails have accounts. Anything else (network,
    // rate limit) gets its own message rather than blaming the password.
    if (error.code === "invalid_credentials") {
      return { error: "That email and password don't match an account." };
    }
    if (error.status === 429) {
      return { error: "Too many sign-in attempts. Wait a minute and try again." };
    }
    return { error: "Couldn't reach the sign-in service. Try again in a moment." };
  }

  redirect(safeNext(parsed.data.next));
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/portal/login");
}

const passwordSchema = z
  .object({
    password: z.string().min(12, "Use at least 12 characters."),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "The two passwords don't match.",
    path: ["confirm"],
  });

export async function changePassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  await requireUser();

  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Sign-in isn't configured on this deployment yet." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  return { success: "Password updated." };
}
