import app from "./app";
import { logger } from "./lib/logger";
import { db, credentialsTable, ensureUpgradeSchema } from "@workspace/db";
import { sql } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function seedCredentials() {
  const existing = await db.select({ count: sql<number>`count(*)::int` }).from(credentialsTable);
  if (existing[0]?.count === 0) {
    await db.insert(credentialsTable).values([
      { username: "admin",     password: "allied2024",    role: "admin" },
      { username: "director",  password: "director2024",  role: "director" },
      { username: "principal", password: "principal2024", role: "admin" },
    ]);
    logger.info("Default credentials seeded into database");
  }
}

ensureUpgradeSchema()
  .then(seedCredentials)
  .catch(err => logger.error({ err }, "Failed to prepare database"));

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
