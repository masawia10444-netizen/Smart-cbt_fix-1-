import fs from "node:fs/promises";
import path from "node:path";

const CMS_URL = process.env.SNAPSHOT_CMS_URL || process.env.NEXT_PUBLIC_CMS_URL;
const ADMIN_TOKEN = process.env.SNAPSHOT_ADMIN_TOKEN || process.env.CMS_ADMIN_TOKEN;
const OUTPUT_DIR = process.env.SNAPSHOT_OUTPUT_DIR || path.resolve("mock-data", "directus-snapshot");
const PAGE_LIMIT = Number(process.env.SNAPSHOT_LIMIT || 200);
const DEFAULT_COLLECTIONS = [
  "applications",
  "application_role_permissions",
  "config_global",
  "config_global_translations",
  "term_conditions",
  "policies",
  "application_consents",
];

const collections = (process.env.SNAPSHOT_COLLECTIONS || DEFAULT_COLLECTIONS.join(","))
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (!CMS_URL) {
  throw new Error("Missing SNAPSHOT_CMS_URL or NEXT_PUBLIC_CMS_URL");
}

if (!ADMIN_TOKEN) {
  throw new Error("Missing SNAPSHOT_ADMIN_TOKEN or CMS_ADMIN_TOKEN");
}

async function fetchCollection(collection) {
  const rows = [];
  let offset = 0;

  while (true) {
    const url = new URL(`/items/${collection}`, CMS_URL);
    url.searchParams.set("limit", String(PAGE_LIMIT));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("fields", "*.*.*");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to export ${collection}: ${response.status} ${body}`);
    }

    const payload = await response.json();
    const data = Array.isArray(payload?.data) ? payload.data : [];
    rows.push(...data);

    if (data.length < PAGE_LIMIT) break;
    offset += PAGE_LIMIT;
  }

  return rows;
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const manifest = {
    source: CMS_URL,
    exportedAt: new Date().toISOString(),
    collections,
  };

  for (const collection of collections) {
    const data = await fetchCollection(collection);
    const target = path.join(OUTPUT_DIR, `${collection}.json`);
    await fs.writeFile(target, JSON.stringify(data, null, 2));
    console.log(`Exported ${collection}: ${data.length} rows`);
  }

  await fs.writeFile(path.join(OUTPUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Snapshot written to ${OUTPUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
