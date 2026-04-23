import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createPgClient } from "./db-connection.mjs";

const migration = process.argv[2];

if (!migration) {
  console.error("Informe o nome da migration. Ex.: npm run db:baseline");
  process.exit(1);
}

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    process.env[trimmed.slice(0, index)] ??= trimmed.slice(index + 1);
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não encontrada em .env.local.");
  process.exit(1);
}

const client = createPgClient(process.env.DATABASE_URL);

try {
  await client.connect();
  await client.query(`
    create table if not exists public.schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    );
  `);
  await client.query("insert into public.schema_migrations (version) values ($1) on conflict do nothing", [migration]);
  console.log(`marked ${migration}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
