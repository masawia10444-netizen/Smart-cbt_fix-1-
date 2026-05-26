"use server";

import { RegisterSchema } from "@/schemas/forms/register-schema";
import { normalizeMobile, registerMTokenUser, registerUser } from "@/utils/cms/adapters/website/users/register";
import { extractErrorMessage } from "@/utils/error";
import { clearMTokenRegisterProfileCookie, getMTokenRegisterProfileCookie } from "@/utils/mtoken";
import { setCookies, setMTokenSession } from "@/utils/token";
import { RegisterUser } from "@/utils/cms/adapters/website/users/types/user";

export async function register(body: RegisterSchema) {
  try {
    if (body.isMToken) {
      const cookieProfile = await getMTokenRegisterProfileCookie();

      if (!cookieProfile) {
        return {
          error: "ไม่พบข้อมูล mToken สำหรับสมัครสมาชิก กรุณาเข้าสู่ระบบด้วย mToken ใหม่อีกครั้ง",
        };
      }

      const profile = {
        email: cookieProfile.email || body.email || "",
        mobile: normalizeMobile(cookieProfile.mobile || body.phoneNumber || ""),
        firstName: cookieProfile.firstName || body.firstName || "",
        lastName: cookieProfile.lastName || body.lastName || "",
        notification: cookieProfile.notification ?? body.notification ?? false,
      };

      const authData = await registerMTokenUser(profile, "PORTAL", body.password);
      await clearMTokenRegisterProfileCookie();

      if (authData?.access_token) {
        await setCookies(authData.access_token, authData.refresh_token, authData.expires, "PORTAL");
        setMTokenSession(true);
      }

      return {
        redirectTo: "/main-menus",
      };
    }

    const data: RegisterUser = {
      email: body.email,
      mobile: body.phoneNumber || null,
      password: body.password || "",
      firstName: body.firstName || null,
      lastName: body.lastName || null,
      citizenId: body.citizenId || null,
    };

    await registerUser(data);

    return {
      redirectTo: "/login",
    };
  } catch (error) {
    console.log("Error Register", error);
    return {
      error: extractErrorMessage(error, "สมัครสมาชิกไม่สำเร็จ"),
    };
  }
}
