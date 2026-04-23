import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createPgClient } from "./db-connection.mjs";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const migrationsDir = path.join(root, "supabase", "migrations");

function loadEnv() {
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    process.env[key] ??= value;
  }
}

async function main() {
  loadEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não encontrada. Defina a connection string do Postgres em .env.local.");
  }

  const client = createPgClient(process.env.DATABASE_URL);

  await client.connect();

  await client.query(`
    create table if not exists public.schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const alreadyApplied = await client.query("select 1 from public.schema_migrations where version = $1", [file]);
    if (alreadyApplied.rowCount) {
      console.log(`skip ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`apply ${file}`);

    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into public.schema_migrations (version) values ($1)", [file]);
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }

  await client.end();
  console.log("migrations ok");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
