// Build a local Smart Mock mToken login URL for browser testing.
const profile = {
  userId: "mock-user-001",
  citizenId: "1101700203451",
  firstName: "Smart",
  lastName: "Mock",
  dateOfBirthString: "1990-01-01",
  mobile: "0812345678",
  email: "smart.mock@example.com",
  notification: true,
};

const appId = "smart-local-app";
const appCode = "PORTAL";
const mToken = `smart-mock:${Buffer.from(JSON.stringify(profile), "utf8").toString("base64")}`;
const loginUrl = `http://localhost:3000/th/login?appId=${encodeURIComponent(appId)}&appCode=${encodeURIComponent(appCode)}&mToken=${encodeURIComponent(mToken)}`;

console.log(JSON.stringify({ appId, appCode, profile, mToken, loginUrl }, null, 2));
