import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const reservedUsernames = new Set([
  "login",
  "signup",
  "dashboard",
  "peladas",
  "perfil",
  "rodadas",
  "auth",
  "api",
  "criar_senha",
  "atualizar_senha",
  "recuperar_senha"
]);

function usernameFromText(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);

  if (normalized.length < 3 || reservedUsernames.has(normalized)) return null;
  return normalized;
}

function metadataText(metadata: Record<string, unknown> | undefined, keys: string[]) {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("name, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      const fallbackName =
        metadataText(user.user_metadata, ["name", "full_name"]) ??
        user.email?.split("@")[0] ??
        "Jogador";
      const googleAvatarUrl = metadataText(user.user_metadata, ["avatar_url", "picture"]);

      await supabase.from("profiles").upsert({
        id: user.id,
        name: currentProfile?.name ?? fallbackName,
        email: user.email ?? "",
        username: currentProfile?.username ?? usernameFromText(user.email?.split("@")[0] ?? fallbackName),
        avatar_url: currentProfile?.avatar_url ?? googleAvatarUrl
      });
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
