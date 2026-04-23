import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function getMyRole(peladaId: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("pelada_members")
    .select("role")
    .eq("pelada_id", peladaId)
    .eq("user_id", user.id)
    .maybeSingle();

  return data?.role as "owner" | "admin" | "player" | undefined;
}

export function canManage(role?: string) {
  return role === "owner" || role === "admin";
}
