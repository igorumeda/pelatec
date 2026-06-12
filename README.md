# Pelatec

Sistema web responsivo para organizar peladas de futebol: membros, rodadas, presença, sorteio de times e financeiro básico.

## Stack

- Next.js App Router
- TypeScript
- Supabase Auth, PostgreSQL e RLS
- Tailwind CSS
- Zod para validação
- Server Actions para mutações principais

## Como rodar

1. Instale as dependências:

```bash
npm install
```

2. Crie um projeto no Supabase e execute a migration:

```sql
-- Supabase SQL Editor
-- cole e execute supabase/migrations/0001_initial_schema.sql
```

Ou configure `DATABASE_URL` em `.env.local` e rode pelo terminal:

```bash
npm run db:migrate
```

Se a migration `0001_initial_schema.sql` já foi executada manualmente no SQL Editor, marque esse baseline antes de rodar novas migrations:

```bash
npm run db:baseline
npm run db:migrate
```

3. Copie as variáveis:

```bash
cp .env.example .env.local
```

4. Preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Para o cadastro de local real da pelada, habilite a Maps JavaScript API e a Places API no Google Cloud e informe a chave em `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

`SUPABASE_SERVICE_ROLE_KEY` deve ser usada apenas no ambiente local/servidor. Ela e necessaria para rodar seeds que criam usuarios de teste no Supabase Auth.

5. Rode o app:

```bash
npm run dev
```

## Dados de teste

Depois de aplicar as migrations, voce pode criar jogadores, peladas, rodadas e financeiro de exemplo:

```bash
npm run db:seed-demo
```

O seed cria duas peladas publicas demo e usuarios de teste com a senha:

```text
Pelatec123!
```

Logins principais:

- `ana.owner@pelatec.demo`
- `bruno.admin@pelatec.demo`
- `carlos.player@pelatec.demo`

O script e idempotente para as peladas demo: ao rodar novamente, remove apenas as peladas com slugs `pelada-rarotec-demo` e `domingo-da-aurora-demo` e recria o cenario.

## Fluxo principal

1. Criar conta em `/signup`
2. Entrar em `/login`
3. Criar uma pelada em `/peladas/nova`
4. Gerenciar membros, agenda e financeiro nos detalhes da pelada
5. Criar uma rodada, confirmar presença, sortear times e registrar placares

## Segurança

A aplicação usa Row Level Security no Supabase. As políticas garantem que perfis só sejam editados pelo próprio usuário, dados internos só sejam vistos por membros da pelada e módulos operacionais/financeiros só sejam gerenciados por `owner` ou `admin`.
