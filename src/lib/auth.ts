import { redirect } from "next/navigation";
import { authClient } from "@/lib/supabase/server";
import { db } from "@/lib/supabase/admin";

export type Role = "owner" | "admin" | "staff";

export async function getAdmin() {
  const supabase = await authClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const { data: row } = await db().from("admins").select("role").eq("user_id", user.id).maybeSingle();
  if (!row) return null;
  return { id: user.id, email: user.email ?? "", role: row.role as Role };
}

/** Use at the top of every admin page and action. `staff` may only check guests in. */
export async function requireAdmin(opts: { allowStaff?: boolean } = {}) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  if (admin.role === "staff" && !opts.allowStaff) redirect("/admin/scan");
  return admin;
}
