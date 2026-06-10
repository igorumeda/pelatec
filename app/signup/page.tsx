import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Mail, Sparkles, UserPlus } from "lucide-react";
import { signUpAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { BrandLogo } from "@/components/brand-logo";
import { Card, CardTitle, Field, LinkButton, PageHeader } from "@/components/ui";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { getUser } from "@/lib/auth";

const signupImage =
  "https://images.pexels.com/photos/5235779/pexels-photo-5235779.jpeg?cs=srgb&dl=pexels-cottonbro-5235779.jpg&fm=jpg";

export default async function SignupPage() {
  const user = await getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="grid gap-6 lg:grid-cols-[0.98fr_1.02fr] lg:items-stretch">
      <Card className="order-2 lg:order-1 lg:p-7">
        <PageHeader
          title="Criar conta"
          description="Informe nome e e-mail para receber seu código de confirmação e entrar no ecossistema do Pelatec."
        />
        <CardTitle icon={UserPlus}>Cadastro</CardTitle>

        <div className="mt-5">
          <ActionStateForm action={signUpAction} submitLabel="Enviar código">
            <Field label="Nome">
              <input name="name" required autoComplete="name" placeholder="Seu nome" />
            </Field>
            <Field label="E-mail">
              <input name="email" type="email" required autoComplete="email" placeholder="você@exemplo.com" />
            </Field>
          </ActionStateForm>
        </div>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          ou
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <GoogleAuthButton />

        <div className="mt-5 space-y-2 text-sm text-slate-600">
          <p>
            Já tem conta?{" "}
            <Link className="font-semibold text-field-700 hover:text-field-600" href="/login">
              Entrar
            </Link>
          </p>
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Mail size={14} />
            Depois de confirmar o código, você cria sua senha.
          </p>
        </div>
      </Card>

      <section className="surface-dark order-1 overflow-hidden p-0 lg:order-2">
        <div className="relative h-full min-h-[360px]">
          <Image src={signupImage} alt="Jogadores de futebol amador reunidos e celebrando" fill className="object-cover opacity-35" sizes="(min-width: 1024px) 50vw, 100vw" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-950/96 via-brand-900/88 to-brand-950/92" />
          <div className="relative flex h-full flex-col justify-between p-7">
            <div className="flex items-center justify-between gap-4">
              <BrandLogo variant="full" theme="dark" className="h-12" />
              <LinkButton href="/" variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                Voltar ao início
              </LinkButton>
            </div>

            <div className="max-w-xl">
              <p className="section-kicker text-field-200">Peladas e jogadores conectados</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white">Entre para a plataforma que ajuda a organizar o jogo de ponta a ponta.</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <SignupTile title="Rodadas" text="Agende partidas e deixe o grupo alinhado antes do dia." />
                <SignupTile title="Comunidade" text="Conecte jogadores às peladas e fortaleça sua base." />
                <SignupTile title="Sorteio" text="Monte os times com os presentes e ajuste quando precisar." />
                <SignupTile title="Financeiro" text="Controle cobranças, pagamentos e despesas com mais clareza." />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SignupTile({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4">
      <div className="flex items-center gap-2 text-white">
        <Sparkles size={16} className="text-accent-300" />
        <p className="font-semibold">{title}</p>
      </div>
      <p className="mt-2 text-sm text-slate-100">{text}</p>
    </div>
  );
}
