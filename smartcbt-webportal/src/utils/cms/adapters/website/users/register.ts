"use server";

import { getProfile } from "@/utils/cms/adapters/authen";
import { getCmsAdminToken, getJwtExpiredIn, getJwtSecretKey, getUserRoleId } from "@/utils/cms/api-helpers";
import cmsApi, { setAdminToken, withRevalidate } from "@/utils/cms/cms-api";
import { extractAuthErrorMessage, extractErrorCode } from "@/utils/error";
import { MTokenProfile } from "@/utils/mtoken";
import { createItem, createUser, deleteUser, readItems, readUsers, updateItem, updateUser } from "@directus/sdk";
import * as jose from "jose";
import * as _ from "lodash";
import { DirectusUser, RegisterUser, UserAccount, UserAppRole } from "./types/user";

async function createUserDirectus(user: DirectusUser) {
  try {
    const data = await cmsApi.request(
      withRevalidate(
        // @ts-ignore
        createUser(user),
        0
      )
    );
    return data;
  } catch (error: unknown) {
    throw "มีผู้ใช้นี้อยู่แล้ว";
  }
}

async function removeUserDirectus(userid: string) {
  await setAdminToken(cmsApi);
  const data = await cmsApi.request(
    withRevalidate(
      // @ts-ignore
      deleteUser(userid),
      0
    )
  );
  cmsApi.setToken(null);
  return data;
}

async function createUserAccount(user: UserAccount) {
  try {
    const data = await cmsApi.request(
      withRevalidate(
        // @ts-ignore
        createItem("users", user),
        0
      )
    );
    return data;
  } catch (error: unknown) {
    const errors: {
      message: string;
      extensions: {
        code: string;
        collection: string;
        field: string;
      };
    }[] = _.get(error, "errors", []);

    if (errors.length > 0 && errors[0].extensions.code === "UNIQUE_CONSTRAINT_VIOLATION") {
      throw "มีผู้ใช้นี้อยู่แล้ว";
    } else if (
      errors.length > 0 &&
      errors[0].extensions.code === "RECORD_NOT_UNIQUE" &&
      errors[0].extensions.field === "mobile"
    ) {
      throw "เบอร์มือถือซ้ำ";
    }

    throw "สมัครสมาชิกไม่สำเร็จ";
  }
}

async function fetchApplications() {
  const data: UserAppRole[] = await cmsApi.request(
    withRevalidate(
      // @ts-ignore
      readItems("applications", {
        filter: {
          status: {
            _eq: "published",
          },
        },
      }),
      0
    )
  );

  return data;
}

async function getRoleUserAllAppication() {
  const data: UserAppRole[] = await cmsApi.request(
    withRevalidate(
      // @ts-ignore
      readItems("application_role_permissions", {
        filter: {
          code: {
            _eq: "user",
          },
        },
      }),
      0
    )
  );

  return data.map((userRole) => {
    return {
      user_app_role: String(userRole.id),
      application: Number(userRole.applications),
      status: "published",
      code: userRole.code,
    };
  });
}

async function updateUserDirectus(userid: string, user: any) {
  const data = await cmsApi.request(
    withRevalidate(
      // @ts-ignore
      updateUser(userid, user),
      0
    )
  );
  return data;
}

async function checkUserExist(email: string) {
  const adminToken = getCmsAdminToken();
  await cmsApi.setToken(adminToken);
  const data = await cmsApi.request(
    // @ts-ignore
    readUsers({
      fields: ["*"],
      filter: {
        email: {
          _eq: email,
        },
      },
    })
  );
  return data;
}

async function findUserAccountByEmail(email: string) {
  const adminToken = getCmsAdminToken();
  await cmsApi.setToken(adminToken);
  
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const data = await cmsApi.request(
      withRevalidate(
        // @ts-ignore
        readItems("users", {
          fields: ["id", "email", "status", "directus_user", "firstname", "lastname", "mobile", "thai_national_id_card"],
          filter: {
            email: {
              _eq: normalizedEmail,
            },
          },
          limit: 1,
        })as any,
        0
      )
    );

    const found = _.get(data, [0], null);
    return found;
  } catch (error) {
    console.error(`findUserAccountByEmail: Error searching for ${normalizedEmail}`, error);
    return null;
  } finally {
    cmsApi.setToken(null);
  }
}

async function findUserAccountByMobile(mobile: string) {
  const adminToken = getCmsAdminToken();
  await cmsApi.setToken(adminToken);
  
  const normalizedMobile = mobile.trim();

  try {
    const data = await cmsApi.request(
      withRevalidate(
        // @ts-ignore
        readItems("users", {
          fields: ["id", "email", "status", "directus_user", "firstname", "lastname", "mobile", "thai_national_id_card"],
          filter: {
            mobile: {
              _eq: normalizedMobile,
            },
          },
          limit: 1,
        })as any,
        0
      )
    );

    const found = _.get(data, [0], null);
    return found;
  } catch (error) {
    console.error(`findUserAccountByMobile: Error searching for ${normalizedMobile}`, error);
    return null;
  } finally {
    cmsApi.setToken(null);
  }
}

async function ensureDirectusStaticToken(directusUserId: string, forceRefresh = false) {
  const adminToken = getCmsAdminToken();
  await cmsApi.setToken(adminToken);

  const directusUsers = await cmsApi.request(
    // @ts-ignore
    readUsers({
      fields: ["id", "token"],
      filter: {
        id: {
          _eq: directusUserId,
        },
      },
      limit: 1,
    })
  );

  const directusUser = _.get(directusUsers, [0], null);
  if (!directusUser?.id) {
    throw "ไม่พบข้อมูลผู้ใช้งานในระบบ";
  }

  let token = !forceRefresh && directusUser.token ? String(directusUser.token) : null;
  if (!token) {
    token = globalThis.crypto.randomUUID();
    await cmsApi.request(
      withRevalidate(
        // @ts-ignore
        updateUser(directusUserId, {
          token,
        }),
        0
      )
    );
  }

  cmsApi.setToken(null);
  return token;
}

async function loginWithStaticTokenByEmail(email: string, appCode: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const userAccount = await findUserAccountByEmail(normalizedEmail);
  if (!userAccount) return null;

  const directusUserId =
    typeof userAccount.directus_user === "string" ? userAccount.directus_user : null;

  if (!directusUserId) {
    throw new Error("ไม่พบข้อมูลผู้ใช้งานในระบบ");
  }

  let token = await ensureDirectusStaticToken(directusUserId);

  try {
    await getProfile(token, appCode);
  } catch (error) {
    if (extractErrorCode(error) !== "INVALID_CREDENTIALS") {
      throw error;
    }

    token = await ensureDirectusStaticToken(directusUserId, true);
    await getProfile(token, appCode);
  }

  return {
    access_token: token,
    refresh_token: null,
    expires: null,
  };
}

async function registerUser(user: RegisterUser) {
  cmsApi.setToken(null);
  const checkUserExistData = await checkUserExist(user.email.trim());
  if (!_.isNil(checkUserExistData) && !_.isEmpty(checkUserExistData)) {
    if (checkUserExistData[0].status === "archived") {
      throw "ผู้ใช้งานนี้ถูกลบไปแล้ว";
    } else {
      throw "มีผู้ใช้นี้อยู่แล้ว";
    }
  }

  const createDirectusUser = await createUserDirectus({
    email: user.email.trim(),
    password: user.password.trim(),
    first_name: user.firstName?.trim() || "",
    last_name: user.lastName?.trim() || "",
    language: "th-TH",
    status: "active",
    role: getUserRoleId(),
  });

  try {
    const applicationsRoleUserList = await getRoleUserAllAppication();
    const createUserAccountData = await createUserAccount({
      email: user.email.trim(),
      directus_user: createDirectusUser.id,
      status: "published",
      mobile: user.mobile,
      firstname: user.firstName?.trim() || null,
      lastname: user.lastName?.trim() || null,
      thai_national_id_card: user.citizenId?.trim() || null,
      applications: applicationsRoleUserList,
    });

    if (_.isNil(createUserAccountData)) return null;

    return true;
  } catch (error: unknown) {
    await removeUserDirectus(createDirectusUser.id);
    throw error;
  }
}

async function registerMTokenUser(profile: MTokenProfile, appCode: string, password = "") {
  if (!profile.email?.trim()) {
    throw "ไม่พบอีเมลจาก mToken";
  }

  if (!password.trim()) {
    throw "กรุณากำหนดรหัสผ่าน";
  }

  const existingUser = await findUserAccountByEmail(profile.email.trim());
  if (existingUser) {
    return await loginWithStaticTokenByEmail(profile.email.trim(), appCode);
  }

  // Fix: Need admin token to create users in Directus
  const adminToken = getCmsAdminToken();
  await cmsApi.setToken(adminToken);

  let createDirectusUser;
  try {
    createDirectusUser = await createUserDirectus({
      email: profile.email.trim(),
      password: password.trim(),
      first_name: profile.firstName?.trim() || "",
      last_name: profile.lastName?.trim() || "",
      language: "th-TH",
      status: "active",
      role: getUserRoleId(),
    });
  } catch (error) {
    cmsApi.setToken(null);
    throw error;
  }

  try {
    const applicationsRoleUserList = await getRoleUserAllAppication();
    const createUserAccountData = await createUserAccount({
      email: profile.email.trim(),
      directus_user: createDirectusUser.id,
      status: "published",
      mobile: profile.mobile?.trim() || null,
      firstname: profile.firstName?.trim() || null,
      lastname: profile.lastName?.trim() || null,
      thai_national_id_card: profile.citizenId?.trim() || null,
      applications: applicationsRoleUserList,
    });

    if (_.isNil(createUserAccountData)) {
      cmsApi.setToken(null);
      return null;
    }

    const token = await ensureDirectusStaticToken(createDirectusUser.id);
    await getProfile(token, appCode);

    cmsApi.setToken(null);
    return {
      access_token: token,
      refresh_token: null,
      expires: null,
    };
  } catch (error: unknown) {
    await removeUserDirectus(createDirectusUser.id);
    cmsApi.setToken(null);
    throw error;
  }
}

async function forgetPassword(email: string) {
  cmsApi.setToken(process.env.CMS_ADMIN_TOKEN || "");

  const user = await cmsApi.request(
    // @ts-ignore
    readItems("users", {
      fields: ["id"],
      filter: {
        email: {
          _eq: email.trim(),
        },
      },
    })
  );

  if (_.isNil(user) || _.isEmpty(user)) return true;

  try {
    const secret = new TextEncoder().encode(getJwtSecretKey());
    const alg = "HS256";
    const token = await new jose.SignJWT({
      sub: user[0].id,
      email,
    })
      .setProtectedHeader({ alg })
      .setExpirationTime(getJwtExpiredIn())
      .setIssuedAt()
      .setSubject(user[0].id)
      .sign(secret);

    await cmsApi.request(updateItem("users", user[0].id, { forget_password_token: token }));
    await cmsApi.setToken(null);
  } catch (error) {
    console.log(error);
  }
  return true;
}

async function resetPassword(jwtToken: string, newPassword: string) {
  const secret = new TextEncoder().encode(getJwtSecretKey());
  try {
    const result = await jose.jwtVerify(jwtToken, secret);

    if (!result.payload.email) throw new Error("โทเคนไม่ถูกต้อง");

    const adminToken = getCmsAdminToken();
    await cmsApi.setToken(adminToken);

    const users = await cmsApi.request(
      //@ts-ignore
      readItems("users", {
        filter: {
          email: {
            _eq: result.payload.email,
          },
        },
      })
    );

    await cmsApi.request(
      updateUser(
        //@ts-ignore
        users[0].directus_user,
        {
          password: newPassword,
        }
      )
    );
  } catch (e) {
    console.log("e: ", e);
    throw "โทเคนไม่ถูกต้อง";
  }
}

async function removeUser(
  userId: string,
  payload: {
    email: string;
    password: string;
  }
) {
  console.log("removeUser", userId, payload);
  try {
    await cmsApi.login(payload.email, payload.password, {});
    const adminToken = getCmsAdminToken();
    await cmsApi.setToken(adminToken);
    await cmsApi.request(
      withRevalidate(
        // @ts-ignore
        updateUser(userId, {
          status: "archived",
        }),
        0
      )
    );
    return true;
  } catch (e: any) {
    throw "ไม่สามารถลบผู้ใช้งานได้";
  }
}

async function listApplications() {
  const res = await cmsApi.request(
    withRevalidate(
      // @ts-ignore
      readItems("applications", {
        fields: ["status", "url", "title_en", "description", "code", "title"],
      }),
      0
    )
  );
  return res ?? [];
}

export {
  checkUserExist,
  createUserAccount,
  createUserDirectus,
  ensureDirectusStaticToken,
  fetchApplications,
  findUserAccountByEmail,
  findUserAccountByMobile,
  forgetPassword,
  getRoleUserAllAppication,
  listApplications,
  loginWithStaticTokenByEmail,
  registerMTokenUser,
  registerUser,
  removeUser,
  removeUserDirectus,
  resetPassword
};
