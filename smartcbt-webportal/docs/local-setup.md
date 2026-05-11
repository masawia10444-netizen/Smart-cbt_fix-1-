# Local Setup

## Goal

Run `smartcbt-webportal` against a local Directus instance first, with special focus on the `mToken` login flow. Then export selected production data into JSON snapshots that we can reuse for local seeding or debugging.

## 1. Webportal local env

Copy `.env.example` to `.env.local` and fill in the local values you want to use.

Recommended local values:

- `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- `NEXT_PUBLIC_CMS_URL=http://127.0.0.1:8055`
- `NEXT_PUBLIC_CMS_WS_URL=ws://127.0.0.1:8055/websocket`
- `CMS_ADMIN_TOKEN=<local-directus-static-token>`
- `NEXT_PUBLIC_ENVIRONMENT=development`

Notes:

- Keep `.env` for legacy or production-like settings if you want, but prefer `.env.local` while developing.
- The current app reads `NEXT_PUBLIC_CMS_URL` and `CMS_ADMIN_TOKEN` directly, so local Directus must expose both an API URL and a valid admin token.

## 2. Start the webportal locally

Use the non-inspector script:

```bash
pnpm dev:local
```

If you prefer Docker for the frontend:

```bash
docker compose -f docker-compose.local.yml up --build
```

## 2.1 mToken local mode

The project already contains a built-in local bypass called `smart-mock:` in [src/utils/mtoken/index.ts](/d:/CBT-demo-mtoken/smartcbt-webportal/src/utils/mtoken/index.ts:56).

That mock path is active only when the app is not in production. In local development it lets us skip the real DGA `mToken` API and inject a fake profile directly.

Generate a local login URL with:

```bash
pnpm mtoken:mock
```

This prints:

- `mToken`: the encoded `smart-mock:` token
- `loginUrl`: a ready-to-open URL like `http://localhost:3000/th/login?...`

You can also override the profile:

```bash
set MTOKEN_PROFILE_JSON={"email":"existing.user@example.com","mobile":"0811111111","firstName":"Demo","lastName":"User"}
pnpm mtoken:mock
```

Recommended test cases:

1. Existing local user:
   Use an email that already exists in local Directus. Expected result: login succeeds and redirects to `/main-menus`.
2. New local user:
   Use an email that does not exist yet. Expected result: redirect to `/register?mtoken=1`.
3. Missing email:
   Remove `email` from the mock profile. Expected result: the flow fails with `ไม่พบอีเมลจากข้อมูล mToken`.

## 3. Directus local env

Create `smartcbt-directus/.env.local` from `smartcbt-directus/.env.local.example`.

Important local values:

- `PUBLIC_URL=http://127.0.0.1:8055`
- `ADMIN_EMAIL=admin@example.com`
- `ADMIN_PASSWORD=d1r3ctu5`

If you already have a local database volume with data, you can keep using it. If not, Directus will bootstrap a new empty instance.

## 4. Start Directus locally

From `smartcbt-directus`:

```bash
docker compose -f docker-compose.local.yml --env-file .env.local up --build
```

This local compose file avoids the shared external `network-stack` dependency so it is easier to boot on a fresh machine.

## 5. Export a production snapshot

From `smartcbt-webportal`:

```bash
set SNAPSHOT_CMS_URL=https://your-production-directus.example
set SNAPSHOT_ADMIN_TOKEN=your-production-admin-token
pnpm snapshot:export
```

Optional overrides:

- `SNAPSHOT_COLLECTIONS=applications,application_role_permissions,config_global`
- `SNAPSHOT_OUTPUT_DIR=mock-data/directus-snapshot`
- `SNAPSHOT_LIMIT=200`

The exporter writes one JSON file per collection plus `manifest.json`.

## 5.1 Recommended collections for mToken work

For `mToken` login and registration, export at least:

- `users`
- `directus_users`
- `applications`
- `application_role_permissions`

For safer, smaller snapshots:

```bash
set SNAPSHOT_COLLECTIONS=applications,application_role_permissions,users
pnpm snapshot:export
```

Note:

- `mToken` login first checks profile data from `mToken`, then tries to match by `email`, and falls back to `mobile`.
- If a user exists, the app creates a static Directus token and logs in.
- If a user does not exist, the app stores the `mToken` profile in a cookie and redirects to registration.

## 6. Recommended workflow

1. Boot local Directus.
2. Boot `webportal` with `.env.local`.
3. Prepare one local Directus user for the "existing user" `mToken` case.
4. Run `pnpm mtoken:mock` and open the generated `loginUrl`.
5. Verify both branches: existing user login and new user registration.
6. Export the collections you need from production.
7. Review and sanitize the JSON before importing anywhere else.
8. Seed those snapshots into local Directus with a separate import step.

## 7. Security note

Do not commit real production tokens, SMTP credentials, or Google API keys into `.env.local`, scripts, or snapshot files.
