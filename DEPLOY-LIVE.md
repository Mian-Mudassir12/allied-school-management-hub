# Live Deploy Guide

This project needs one Node web service and one PostgreSQL database.

## Recommended Setup

Use:
- Render for the public web app link.
- Neon or Render Postgres for `DATABASE_URL`.

## Render Web Service Settings

Create a new Web Service from the GitHub repo and keep the root directory as the repository root.

Build command:

```bash
pnpm install --frozen-lockfile
PORT=3000 BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/allied-school run build
pnpm --filter @workspace/api-server run build
mkdir -p artifacts/api-server/dist/public
cp -R artifacts/allied-school/dist/public/* artifacts/api-server/dist/public/
pnpm --filter @workspace/db run push
```

Start command:

```bash
NODE_ENV=production pnpm --filter @workspace/api-server run start
```

Environment variables:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
NODE_ENV=production
```

Render provides `PORT` automatically.

## Login After Deploy

The app seeds these accounts if the credentials table is empty:

```text
admin / allied2024
director / director2024
principal / principal2024
```

Change these passwords from Settings after the first successful login.

## Notes

- Do not use a local `localhost` link for client/sir review.
- The final public link will look like `https://your-service-name.onrender.com`.
- Google Sheets, WhatsApp, SMS, and banking config need real API keys before those integrations can send data externally.
