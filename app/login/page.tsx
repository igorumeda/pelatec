import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, LogIn } from "lucide-react";
import { signInAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { BrandLogo } from "@/components/brand-logo";
import { Card, CardTitle, Field, LinkButton, PageHeader } from "@/components/ui";
import { GoogleAuthButton } from "@/components/google-auth-button";

const authImage =
  "https://images.pexels.com/photos/6077792/pexels-photo-6077792.jpeg?cs=srgb&dl=pexels-tima-miroshnichenko-6077792.jpg&fm=jpg";

export default function LoginPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
      <Card className="order-2 lg:order-1 lg:p-7">
        <PageHeader title="Entrar" description="Acesse sua conta para administrar peladas, rodadas e cobranças." />
        <CardTitle icon={LogIn}>Acesso</CardTitle>

        <div className="mt-5">
          <ActionStateForm action={signInAction} submitLabel="Entrar">
            <Field label="E-mail">
              <input name="email" type="email" required autoComplete="email" placeholder="você@exemplo.com" />
            </Field>
            <Field label="Senha">
              <input name="password" type="password" required autoComplete="current-password" placeholder="Sua senha" />
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
            Ainda não tem conta?{" "}
            <Link className="font-semibold text-field-700 hover:text-field-600" href="/signup">
              Criar conta
            </Link>
          </p>
          <p>
            Esqueceu a senha?{" "}
            <Link className="font-semibold text-field-700 hover:text-field-600" href="/recuperar-senha">
              Recuperar acesso
            </Link>
          </p>
        </div>
      </Card>

      <section className="surface-dark order-1 overflow-hidden p-0 lg:order-2">
        <div className="relative h-full min-h-[360px]">
          <Image src={authImage} alt="Time de futebol amador reunido antes da partida" fill className="object-cover opacity-45" sizes="(min-width: 1024px) 50vw, 100vw" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-950/96 via-brand-900/88 to-brand-950/92" />
          <div className="relative flex h-full flex-col justify-between p-7">
            <div className="flex items-center justify-between gap-4">
              <BrandLogo variant="full" theme="dark" className="h-12" />
              <LinkButton href="/" variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                Voltar ao início
              </LinkButton>
            </div>

            <div className="max-w-xl">
              <p className="section-kicker text-field-200">Tecnologia para futebol amador</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white">Organize sua próxima rodada com menos ruído e mais controle.</h2>
              <div className="mt-6 space-y-4">
                <AuthPoint text="Presença e pendências sempre visíveis para o grupo." />
                <AuthPoint text="Sorteio de times no campo, com ajustes manuais quando precisar." />
                <AuthPoint text="Financeiro simples para quem precisa tocar a pelada toda semana." />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function AuthPoint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-field-300" />
      <p className="text-sm text-slate-100">{text}</p>
    </div>
  );
}
