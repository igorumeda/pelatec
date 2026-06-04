import type { Metadata } from "next";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { UserMenu } from "@/components/header-menus";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pelatec",
  description: "Organização de peladas, conexão entre jogadores e futebol amador mais organizado."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  noStore();
  const user = await getUser();
  let profile: { name: string; email: string; avatar_url?: string | null; username?: string | null } | null = null;
  let notifications: Array<{
    id: string;
    title: string;
    description: string;
    href: string;
    created_at: string;
    kind: "financeira" | "aprovacao";
  }> = [];

  if (user) {
    const supabase = await createClient();
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("name, email, avatar_url, username")
      .eq("id", user.id)
      .maybeSingle();
    profile = {
      name: profileRow?.name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Usuário",
      email: profileRow?.email ?? user.email ?? "",
      avatar_url: profileRow?.avatar_url ?? null,
      username: profileRow?.username ?? null
    };

    const { data: memberships } = await supabase
      .from("pelada_members")
      .select("role, peladas(id, name, venue)")
      .eq("user_id", user.id);
    const adminPeladaIds = memberships
      ?.filter((row: any) => row.role === "owner" || row.role === "admin")
      .map((row: any) => row.peladas?.id)
      .filter(Boolean) ?? [];

    const { data: myCharges } = await supabase
      .from("player_charges")
      .select("id, description, amount, created_at, pelada_id, peladas(name)")
      .eq("user_id", user.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(20);

    const { data: adminPayments } = adminPeladaIds.length
      ? await supabase
          .from("player_payments")
          .select("id, amount, created_at, pelada_id, user_id, charge_id")
          .in("pelada_id", adminPeladaIds)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(20)
      : { data: [] };

    const adminUserIds = [...new Set((adminPayments ?? []).map((payment: any) => payment.user_id))];
    const adminChargeIds = [...new Set((adminPayments ?? []).map((payment: any) => payment.charge_id).filter(Boolean))];
    const { data: paymentProfiles } = adminUserIds.length
      ? await supabase.from("profiles").select("id, name").in("id", adminUserIds)
      : { data: [] };
    const { data: paymentCharges } = adminChargeIds.length
      ? await supabase.from("player_charges").select("id, description").in("id", adminChargeIds)
      : { data: [] };

    const peladaName = new Map((memberships ?? []).map((row: any) => [row.peladas?.id, row.peladas?.name]));
    const profileName = new Map((paymentProfiles ?? []).map((item: any) => [item.id, item.name]));
    const chargeDesc = new Map((paymentCharges ?? []).map((item: any) => [item.id, item.description]));

    const financialNotifications = (myCharges ?? []).map((charge: any) => ({
      id: `charge-${charge.id}`,
      title: charge.peladas?.name ? `Cobrança em ${charge.peladas.name}` : "Nova cobrança",
      description: `${charge.description} - R$ ${Number(charge.amount).toFixed(2)}`,
      href: "/dashboard",
      created_at: charge.created_at,
      kind: "financeira" as const
    }));

    const approvalNotifications = (adminPayments ?? []).map((payment: any) => ({
      id: `payment-${payment.id}`,
      title: `${profileName.get(payment.user_id) ?? "Jogador"} enviou pagamento`,
      description: `${peladaName.get(payment.pelada_id) ?? "Pelada"} - ${chargeDesc.get(payment.charge_id) ?? "Cobrança"}`,
      href: `/peladas/${payment.pelada_id}/financeiro`,
      created_at: payment.created_at,
      kind: "aprovacao" as const
    }));

    notifications = [...financialNotifications, ...approvalNotifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  return (
    <html lang="pt-BR">
      <body>
        <header className="sticky top-0 z-20 border-b border-brand-700/80 bg-brand-950/92 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3 text-white">
              <BrandLogo variant="icon" className="h-10 w-10 shrink-0" />
              <div className="hidden sm:block">
                <p className="text-lg font-extrabold leading-none tracking-tight">Pelatec</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-200">Organize, conecte e jogue</p>
              </div>
            </Link>

            <nav className="flex items-center gap-2">
              {user && profile ? (
                <UserMenu profile={profile} notifications={notifications} />
              ) : (
                <>
                  <Link className="rounded-xl px-3 py-2 text-sm font-medium text-white hover:bg-white/10 hover:text-white" href="/login">
                    Entrar
                  </Link>
                  <Link className="inline-flex items-center gap-2 rounded-xl bg-field-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-field-600" href="/signup">
                    <Sparkles size={16} />
                    Criar conta
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="mx-auto min-h-[calc(100vh-72px)] max-w-7xl px-4 py-8 sm:py-10">{children}</main>
      </body>
    </html>
  );
}
