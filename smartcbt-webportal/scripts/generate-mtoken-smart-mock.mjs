import { existsSync, readFileSync } from "node:fs";

function loadEnvFile(path) {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] == null) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const DEFAULT_PROFILE = {
  userId: "mock-masa",
  citizenId: "1101700203451",
  firstName: "เมษา",
  lastName: "เวียนวงศ์",
  dateOfBirthString: "1990-01-01",
  mobile: "0998887776", // Unique dummy mobile so it fails mobile check
  email: "dummy.duplicate.999@example.com", // Unique dummy email so it fails email check
  notification: true,
};

const appId = process.env.MTOKEN_APP_ID || "smart-local-app";
const appCode = process.env.MTOKEN_APP_CODE || "PORTAL";

const profile = {
  ...DEFAULT_PROFILE,
  ...(process.env.MTOKEN_PROFILE_JSON ? JSON.parse(process.env.MTOKEN_PROFILE_JSON) : {}),
};

const encoded = Buffer.from(JSON.stringify(profile), "utf8").toString("base64");
const mToken = `smart-mock:${encoded}`;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const loginUrl = `${siteUrl}/th/login?appId=${encodeURIComponent(appId)}&appCode=${encodeURIComponent(appCode)}&mToken=${encodeURIComponent(mToken)}`;

console.log(JSON.stringify({ appId, appCode, profile, mToken, loginUrl }, null, 2));
