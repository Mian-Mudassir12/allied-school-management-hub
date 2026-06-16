import app from "../artifacts/api-server/src/app";
import { ensureUpgradeSchema, pool } from "../lib/db/src/index";

let ready: Promise<void> | null = null;

async function seedCredentials() {
  const existing = await pool.query<{ count: number }>("SELECT count(*)::int AS count FROM credentials");
  if ((existing.rows[0]?.count ?? 0) === 0) {
    await pool.query(
      "INSERT INTO credentials (username, password, role) VALUES ($1, $2, $3), ($4, $5, $6), ($7, $8, $9)",
      ["admin", "allied2024", "admin", "director", "director2024", "director", "principal", "principal2024", "admin"],
    );
  }
}

async function prepareDatabase() {
  if (!ready) {
    ready = ensureUpgradeSchema().then(seedCredentials);
  }
  return ready;
}

export default async function handler(req: any, res: any) {
  await prepareDatabase();
  return (app as any)(req, res);
}
