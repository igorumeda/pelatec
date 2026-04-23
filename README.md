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
```

5. Rode o app:

```bash
npm run dev
```

## Fluxo principal

1. Criar conta em `/signup`
2. Entrar em `/login`
3. Criar uma pelada em `/peladas/nova`
4. Gerenciar membros, agenda e financeiro nos detalhes da pelada
5. Criar uma rodada, confirmar presença, sortear times e registrar placares

## Segurança

A aplicação usa Row Level Security no Supabase. As políticas garantem que perfis só sejam editados pelo próprio usuário, dados internos só sejam vistos por membros da pelada e módulos operacionais/financeiros só sejam gerenciados por `owner` ou `admin`.
