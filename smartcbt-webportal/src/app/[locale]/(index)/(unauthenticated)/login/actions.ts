"use server";

import {
  findUserAccountByEmail,
  findUserAccountByFullName,
  findUserAccountByMobile,
  loginWithStaticTokenByUserAccount,
  normalizeMobile,
} from "@/utils/cms/adapters/website/users/register";
import { loginEmail, loginMobile } from "@/utils/cms/cms-api-adapter";
import { fetchMTokenProfile, setMTokenRegisterProfileCookie } from "@/utils/mtoken";
import { extractAuthErrorMessage, extractErrorMessage } from "@/utils/error";
import { clearSession } from "@/utils/session";
import { setCookies, setMTokenSession } from "@/utils/token";
import { revalidatePath } from "next/cache";

export async function login(body: Record<string, any | string>) {
  try {
    let token = null;
    let expires = null;
    let refreshToken = null;
    if (body.phoneNumber) {
      const mobileData = await loginMobile(body.phoneNumber, body.password.trim(), body.appCode);
      if (mobileData.access_token) {
        token = mobileData.access_token;
        expires = mobileData.expires;
        refreshToken = mobileData.refresh_token;
      }
    } else {
      const emailData = await loginEmail(body.email.trim(), body.password.trim(), body.appCode);
      if (emailData.access_token) {
        token = emailData.access_token;
        expires = emailData.expires;
        refreshToken = emailData.refresh_token;
      }
    }
    if (token == null) return { error: "ไม่มีบัญชีโปรดตรวจสอบ อีเมล/โทรศัพท์ หรือ รหัสผ่าน" };
    await setCookies(token, refreshToken, expires, body.appCode);
    setMTokenSession(false); // Ensure regular login clears any mToken flag
    return { success: true };
  } catch (error) {
    console.log("login error:", error);
    return {
      error: extractAuthErrorMessage(error, "เข้าสู่ระบบไม่สำเร็จ"),
    };
  }
}

export async function loginWithMToken(body: { appId: string; mToken: string; appCode?: string }) {
  const appCode = body.appCode || "PORTAL";

  try {
    let profile: any;

    try {
      profile = await fetchMTokenProfile(body.appId, body.mToken);
    } catch (profileError) {
      console.error("loginWithMToken: fetchMTokenProfile failed:", profileError);
      const errorMsg = extractErrorMessage(profileError, "ไม่สามารถดึงข้อมูลโปรไฟล์จาก mToken ได้");
      return { error: errorMsg };
    }

    const email = String(profile?.email || "")
      .trim()
      .toLowerCase();
    const mobile = normalizeMobile(String(profile?.mobile || ""));
    const firstName = String(profile?.firstName || "").trim();
    const lastName = String(profile?.lastName || "").trim();

    if (!email && !mobile && (!firstName || !lastName)) {
      return { error: "ไม่พบอีเมล เบอร์โทรศัพท์ หรือชื่อ-นามสกุลจากข้อมูล mToken" };
    }

    let existingUser: any;

    if (email) {
      try {
        existingUser = await findUserAccountByEmail(email);
      } catch (findError) {
        console.error("loginWithMToken: findUserAccountByEmail failed:", findError);
        const errorMsg = extractErrorMessage(findError, "ไม่สามารถค้นหาผู้ใช้ได้");
        return { error: errorMsg };
      }
    }

    // Fallback: Check by mobile if email lookup failed
    if (!existingUser && mobile) {
      try {
        existingUser = await findUserAccountByMobile(mobile);
      } catch (findMobileError) {
        console.error("loginWithMToken: findUserAccountByMobile failed:", findMobileError);
        const errorMsg = extractErrorMessage(findMobileError, "ไม่สามารถค้นหาผู้ใช้ด้วยเบอร์โทรศัพท์ได้");
        return { error: errorMsg };
      }
    }

    // Fallback: Check by full name if email and mobile lookup failed
    if (!existingUser && firstName && lastName) {
      try {
        existingUser = await findUserAccountByFullName(firstName, lastName);
      } catch (findFullNameError) {
        console.error("loginWithMToken: findUserAccountByFullName failed:", findFullNameError);
        const errorMsg = extractErrorMessage(findFullNameError, "ไม่สามารถค้นหาผู้ใช้ด้วยชื่อและนามสกุลได้");
        return { error: errorMsg };
      }
    }

    if (existingUser) {
      let authData: any;

      try {
        authData = await loginWithStaticTokenByUserAccount(existingUser, appCode);
      } catch (authError) {
        console.error("loginWithMToken: loginWithStaticTokenByEmail failed:", authError);
        const errorMsg = extractAuthErrorMessage(authError, "ไม่สามารถสร้าง token ได้");
        return { error: errorMsg };
      }

      if (!authData || !authData?.access_token) {
        return { error: "ไม่สามารถสร้าง access token สำหรับผู้ใช้ได้" };
      }

      try {
        await setCookies(authData.access_token, authData.refresh_token, authData.expires, appCode);
        setMTokenSession(true); // Flag this session as an mToken session
      } catch (cookieError) {
        console.error("loginWithMToken: setCookies failed:", cookieError);
        const errorMsg = extractErrorMessage(cookieError, "ไม่สามารถตั้งค่า cookies ได้");
        return { error: errorMsg };
      }

      return { redirectTo: "/main-menus", source: "login" };
    }

    if (!email && !mobile) {
      return { error: "ไม่พบอีเมลหรือเบอร์โทรศัพท์จากข้อมูล mToken สำหรับสมัครสมาชิกใหม่" };
    }

    try {
      await setMTokenRegisterProfileCookie(profile);
    } catch (cookieError) {
      console.error("loginWithMToken: setMTokenRegisterProfileCookie failed:", cookieError);
      const errorMsg = extractErrorMessage(cookieError, "ไม่สามารถตั้งค่า registration cookie ได้");
      return { error: errorMsg };
    }

    return { redirectTo: "/register?mtoken=1", source: "register" };
  } catch (error) {
    console.error("loginWithMToken: Unexpected error:", error);
    const message = extractErrorMessage(error, "ไม่สามารถเข้าสู่ระบบด้วย mToken ได้");
    return { error: message };
  }
}

export async function logout() {
  clearSession();
  setMTokenSession(false);
  revalidatePath("/");
}
