import pg from "pg";

export function createPgClient(connectionString) {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");

  const ssl =
    sslMode === "disable"
      ? false
      : sslMode === "verify-full"
        ? true
        : { rejectUnauthorized: false };

  if (sslMode !== "verify-full") {
    url.searchParams.delete("sslmode");
  }

  return new pg.Client({
    connectionString: url.toString(),
    ssl
  });
}
