import app from "../artifacts/api-server/src/app";
import { db, credentialsTable, ensureUpgradeSchema } from "../lib/db/src/index";
import { sql } from "drizzle-orm";

let ready: Promise<void> | null = null;

async function seedCredentials() {
  const existing = await db.select({ count: sql<number>`count(*)::int` }).from(credentialsTable);
  if (existing[0]?.count === 0) {
    await db.insert(credentialsTable).values([
      { username: "admin", password: "allied2024", role: "admin" },
      { username: "director", password: "director2024", role: "director" },
      { username: "principal", password: "principal2024", role: "admin" },
    ]);
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
