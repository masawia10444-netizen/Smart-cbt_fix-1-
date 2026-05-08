"use server";

import { RegisterSchema } from "@/schemas/forms/register-schema";
import { registerMTokenUser, registerUser } from "@/utils/cms/adapters/website/users/register";
import { extractErrorMessage } from "@/utils/error";
import { clearMTokenRegisterProfileCookie, getMTokenRegisterProfileCookie } from "@/utils/mtoken";
import { setCookies } from "@/utils/token";
import { RegisterUser } from "@/utils/cms/adapters/website/users/types/user";

export async function register(body: RegisterSchema) {
  try {
    if (body.isMToken) {
      const cookieProfile = await getMTokenRegisterProfileCookie();
      const profile = {
        email: body.email || cookieProfile?.email || "",
        mobile: body.phoneNumber || cookieProfile?.mobile || "",
        firstName: body.firstName || cookieProfile?.firstName || "",
        lastName: body.lastName || cookieProfile?.lastName || "",
        citizenId: body.citizenId || cookieProfile?.citizenId || "",
        dateOfBirthString: body.dateOfBirthString || cookieProfile?.dateOfBirthString || "",
        notification: body.notification ?? cookieProfile?.notification ?? false,
      };

      const authData = await registerMTokenUser(profile, "PORTAL", body.password);
      await clearMTokenRegisterProfileCookie();

      if (authData?.access_token) {
        await setCookies(authData.access_token, authData.refresh_token, authData.expires, "PORTAL");
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
