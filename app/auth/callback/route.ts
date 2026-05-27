import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      const fallbackName = typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()
        ? user.user_metadata.name
        : typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
          ? user.user_metadata.full_name
          : user.email?.split("@")[0] ?? "Jogador";

      await supabase.from("profiles").upsert({
        id: user.id,
        name: fallbackName,
        email: user.email ?? ""
      });
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
