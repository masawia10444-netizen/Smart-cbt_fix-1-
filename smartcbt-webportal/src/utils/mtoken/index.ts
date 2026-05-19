import { cookies } from "next/headers";

export type MTokenProfile = {
  userId?: string;
  citizenId?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirthString?: string;
  mobile?: string;
  email?: string;
  notification?: boolean;
};

export const MTOKEN_REGISTER_PROFILE_COOKIE = "MTOKEN_REGISTER_PROFILE";

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export async function fetchMTokenAuthToken() {
  const url = new URL(getRequiredEnv("GDX_AUTH_URL"));
  url.searchParams.set("ConsumerSecret", getRequiredEnv("CONSUMER_SECRET"));
  url.searchParams.set("AgentID", getRequiredEnv("AGENT_ID"));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Consumer-Key": getRequiredEnv("CONSUMER_KEY"),
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const raw = await response.text();
  let payload: any = null;

  try {
    payload = JSON.parse(raw);
  } catch {}

  console.log("[mToken auth] status =", response.status);
  console.log("[mToken auth] raw =", raw);

  if (!response.ok || !payload?.Result) {
    throw new Error(payload?.message || `mToken authentication failed (${response.status})`);
  }

  return String(payload.Result);
}


export async function fetchMTokenProfile(appId: string, mToken: string): Promise<MTokenProfile> {
  console.log("[mToken profile] appId =", appId);
  console.log("[mToken profile] mToken =", mToken);

  // Mock Interceptor for local development
  const isDevelopment = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' || process.env.NEXT_PUBLIC_ENVIRONMENT === 'uat';
  if (isDevelopment && mToken.startsWith("smart-mock:")) {
    const base64Payload = mToken.replace("smart-mock:", "");
    try {
      const decodedString = Buffer.from(base64Payload, "base64").toString("utf-8");
      const mockResult = JSON.parse(decodedString);
      
      console.log("[mToken profile] Smart Mock matched, payload =", mockResult);
      
      return {
        userId: mockResult.userId || mockResult.UserId || `mock-user-${Date.now()}`,
        citizenId: mockResult.citizenId || mockResult.CitizenId,
        firstName: mockResult.firstName || mockResult.FirstName,
        lastName: mockResult.lastName || mockResult.LastName,
        dateOfBirthString: mockResult.dateOfBirthString || mockResult.DateOfBirthString,
        mobile: mockResult.mobile || mockResult.Mobile || mockResult.telephone || mockResult.phoneNumber,
        email: mockResult.email || mockResult.Email,
        notification: mockResult.notification !== undefined ? mockResult.notification : mockResult.Notification,
      } as MTokenProfile;
    } catch (e) {
      console.error("[mToken profile] Failed to parse Smart Mock payload:", e);
      throw new Error("ข้อมูลจำลอง MToken (Smart Mock) ไม่ถูกต้อง โปรดตรวจสอบรหัส Base64 อีกครั้ง");
    }
  }

  let token: string;
  try {
    token = await fetchMTokenAuthToken();
  } catch (authError) {
    console.error("[mToken profile] Failed to fetch auth token:", authError);
    throw new Error("ไม่สามารถตรวจสอบสิทธิ mToken ได้ โปรดลองใหม่อีกครั้ง");
  }

  const response = await fetch(getRequiredEnv("PROFILE_ACCESS_API_URL"), {
    method: "POST",
    headers: {
      "Consumer-Key": getRequiredEnv("CONSUMER_KEY"),
      "Content-Type": "application/json",
      Token: token,
    },
    body: JSON.stringify({
      AppId: appId,
      MToken: mToken,
    }),
    cache: "no-store",
  });

  const raw = await response.text();
  let payload: any = null;

  try {
    payload = JSON.parse(raw);
  } catch {}

  console.log("[mToken profile] appId =", appId);
  console.log("[mToken profile] mToken =", mToken);
  console.log("[mToken profile] status =", response.status);
  console.log("[mToken profile] raw =", raw);

  if (!response.ok || payload?.messageCode !== 200 || !payload?.result) {
    const errorMessage = payload?.message || `ไม่สามารถดึงข้อมูลผู้ใช้จาก mToken ได้ (${response.status})`;
    
    // Handle specific mToken errors
    if (errorMessage.includes("redis data not found")) {
      throw new Error("mToken ของคุณหมดอายุแล้ว โปรดลองเข้าระบบใหม่อีกครั้ง");
    }
    
    throw new Error(errorMessage);
  }

  const result = payload.result;

  // Robust data mapping to handle different casing from UAT/Mock APIs
  return {
    userId: result.userId || result.UserId,
    citizenId: result.citizenId || result.CitizenId,
    firstName: result.firstName || result.FirstName,
    lastName: result.lastName || result.LastName,
    dateOfBirthString: result.dateOfBirthString || result.DateOfBirthString,
    mobile: result.mobile || result.Mobile || result.telephone || result.phoneNumber,
    email: result.email || result.Email,
    notification: result.notification !== undefined ? result.notification : result.Notification
  } as MTokenProfile;
}

export async function setMTokenRegisterProfileCookie(profile: MTokenProfile) {
  cookies().set(MTOKEN_REGISTER_PROFILE_COOKIE, JSON.stringify(profile), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });
}

export async function getMTokenRegisterProfileCookie(): Promise<MTokenProfile | null> {
  const rawValue = cookies().get(MTOKEN_REGISTER_PROFILE_COOKIE)?.value;
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue) as MTokenProfile;
  } catch {
    return null;
  }
}

export async function clearMTokenRegisterProfileCookie() {
  cookies().delete(MTOKEN_REGISTER_PROFILE_COOKIE);
}