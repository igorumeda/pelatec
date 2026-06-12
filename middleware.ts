import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: boolean | "lax" | "strict" | "none";
  secure?: boolean;
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isRestrictedPath = [
    "/dashboard",
    "/peladas",
    "/rodadas",
    "/perfil",
    "/explorar"
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (user && (isRestrictedPath || pathname === "/onboarding")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, username, position, shooting, dribbling, passing, strength, speed, defense")
      .eq("id", user.id)
      .maybeSingle();
    const profileComplete = isProfileComplete(profile);

    if (!profileComplete && isRestrictedPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (profileComplete && pathname === "/onboarding") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

function isProfileComplete(profile: {
  name?: string | null;
  username?: string | null;
  position?: string | null;
  shooting?: number | string | null;
  dribbling?: number | string | null;
  passing?: number | string | null;
  strength?: number | string | null;
  speed?: number | string | null;
  defense?: number | string | null;
} | null) {
  if (!profile?.name?.trim() || !profile.username?.trim() || !profile.position) return false;

  const total =
    Number(profile.shooting ?? 0) +
    Number(profile.dribbling ?? 0) +
    Number(profile.passing ?? 0) +
    Number(profile.strength ?? 0) +
    Number(profile.speed ?? 0) +
    Number(profile.defense ?? 0);

  return total === 10;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
