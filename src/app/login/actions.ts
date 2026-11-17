"use server";

import { redirect } from "next/navigation";
import { authClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/auth";

export async function signIn(_prev: { error?: string }, fd: FormData) {
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const supabase = await authClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Invalid email or password." };
  const admin = await getAdmin();
  if (!admin) {
    await supabase.auth.signOut();
    return { error: "This account doesn't have admin access." };
  }
  redirect(admin.role === "staff" ? "/admin/scan" : "/admin");
}

export async function signOut() {
  const supabase = await authClient();
  await supabase.auth.signOut();
  redirect("/login");
}
