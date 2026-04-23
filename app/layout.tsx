import type { Metadata } from "next";
import Link from "next/link";
import { Dumbbell, LogOut, UserRound } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { getUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pelatec",
  description: "Organização de peladas de futebol"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  return (
    <html lang="pt-BR">
      <body>
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 font-bold text-ink">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-field-600 text-white">
                <Dumbbell size={18} />
              </span>
              Pelatec
            </Link>
            <nav className="flex items-center gap-2">
              {user ? (
                <>
                  <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-zinc-100" href="/peladas">
                    Peladas
                  </Link>
                  <Link className="rounded-md p-2 hover:bg-zinc-100" href="/perfil" aria-label="Perfil">
                    <UserRound size={18} />
                  </Link>
                  <form action={signOutAction}>
                    <button className="rounded-md p-2 hover:bg-zinc-100" aria-label="Sair">
                      <LogOut size={18} />
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-zinc-100" href="/login">
                    Entrar
                  </Link>
                  <Link className="rounded-md bg-field-600 px-3 py-2 text-sm font-semibold text-white" href="/signup">
                    Criar conta
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-64px)] max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
