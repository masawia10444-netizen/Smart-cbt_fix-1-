"use server";

import { getProfile } from "@/utils/cms/adapters/authen";
import { getCmsAdminToken, getJwtExpiredIn, getJwtSecretKey, getUserRoleId } from "@/utils/cms/api-helpers";
import cmsApi, { setAdminToken, withRevalidate } from "@/utils/cms/cms-api";
import { extractAuthErrorMessage, extractErrorCode, extractErrorMessage } from "@/utils/error";
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
    const code = extractErrorCode(error);
    const field = String(_.get(error, "errors.0.extensions.field", ""));
    const message = extractErrorMessage(error, "");

    if (
      code === "RECORD_NOT_UNIQUE" ||
      code === "UNIQUE_CONSTRAINT_VIOLATION" ||
      field === "email" ||
      message.includes("directus_users_email_unique")
    ) {
      throw "มีผู้ใช้นี้อยู่แล้ว";
    }

    console.error("createUserDirectus failed:", error);
    throw message || "สร้างบัญชีผู้ใช้ไม่สำเร็จ";
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

    const firstError = errors[0];
    const code = firstError?.extensions?.code;
    const field = firstError?.extensions?.field;
    const message = _.get(error, "errors.0.message", "");

    if (code === "RECORD_NOT_UNIQUE" && field === "mobile") {
      throw "เบอร์โทรศัพท์นี้มีผู้ใช้งานอยู่แล้ว";
    }

    if (code === "RECORD_NOT_UNIQUE" && field === "email") {
      throw "มีผู้ใช้นี้อยู่แล้ว";
    }

    if (
      code === "UNIQUE_CONSTRAINT_VIOLATION" &&
      (field === "mobile" || message.includes("users_mobile_unique"))
    ) {
      throw "เบอร์โทรศัพท์นี้มีผู้ใช้งานอยู่แล้ว";
    }

    if (
      code === "UNIQUE_CONSTRAINT_VIOLATION" &&
      (field === "email" || message.includes("users_email_unique"))
    ) {
      throw "มีผู้ใช้นี้อยู่แล้ว";
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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeMobile(mobile: string) {
  const trimmed = mobile.trim();
  const digits = trimmed.replace(/[^\d+]/g, "");

  if (digits.startsWith("+66")) {
    return `0${digits.slice(3).replace(/\D/g, "")}`;
  }

  if (digits.startsWith("66")) {
    return `0${digits.slice(2).replace(/\D/g, "")}`;
  }

  return digits.replace(/\D/g, "");
}

function getMobileLookupValues(mobile: string) {
  const trimmed = mobile.trim();
  const normalized = normalizeMobile(trimmed);
  const values = new Set<string>();

  if (trimmed) values.add(trimmed);
  if (normalized) values.add(normalized);

  if (normalized.startsWith("0") && normalized.length > 1) {
    values.add(`+66${normalized.slice(1)}`);
    values.add(`66${normalized.slice(1)}`);
  }

  return Array.from(values);
}

async function findUserAccountByEmail(email: string) {
  const adminToken = getCmsAdminToken();
  await cmsApi.setToken(adminToken);

  const normalizedEmail = normalizeEmail(email);

  try {
    const data = await cmsApi.request(
      withRevalidate(
        // @ts-ignore
        readItems("users", {
          fields: [
            "id",
            "email",
            "status",
            "directus_user",
            "firstname",
            "lastname",
            "mobile",
            "thai_national_id_card",
          ],
          filter: {
            email: {
              _eq: normalizedEmail,
            },
            status: {
              _eq: "published",
            },
          },
          limit: 1,
        }) as any,
        0
      )
    );

    const found = _.get(data, [0], null);
    return found;
  } catch (error) {
    console.error("findUserAccountByEmail failed:", error);
    throw error;
  } finally {
    cmsApi.setToken(null);
  }
}

async function findUserAccountByEmailAnyStatus(email: string) {
  const adminToken = getCmsAdminToken();
  await cmsApi.setToken(adminToken);

  const normalizedEmail = normalizeEmail(email);

  try {
    const data = await cmsApi.request(
      withRevalidate(
        // @ts-ignore
        readItems("users", {
          fields: [
            "id",
            "email",
            "status",
            "directus_user",
            "firstname",
            "lastname",
            "mobile",
            "thai_national_id_card",
          ],
          filter: {
            email: {
              _eq: normalizedEmail,
            },
          },
          limit: 1,
        }) as any,
        0
      )
    );

    return _.get(data, [0], null);
  } catch (error) {
    console.error("findUserAccountByEmailAnyStatus failed:", error);
    throw error;
  } finally {
    cmsApi.setToken(null);
  }
}

async function findUserAccountByMobile(mobile: string) {
  const adminToken = getCmsAdminToken();
  await cmsApi.setToken(adminToken);

  const lookupValues = getMobileLookupValues(mobile);

  try {
    if (lookupValues.length === 0) return null;

    const data = await cmsApi.request(
      withRevalidate(
        // @ts-ignore
        readItems("users", {
          fields: [
            "id",
            "email",
            "status",
            "directus_user",
            "firstname",
            "lastname",
            "mobile",
            "thai_national_id_card",
          ],
          filter: {
            _or: lookupValues.map((value) => ({
              mobile: {
                _eq: value,
              },
            })),
            status: {
              _eq: "published",
            },
          },
          limit: 2,
        }) as any,
        0
      )
    );

    if (Array.isArray(data) && data.length > 1) {
      throw new Error("พบผู้ใช้งานเบอร์โทรศัพท์ซ้ำ ไม่สามารถเข้าสู่ระบบอัตโนมัติได้");
    }

    const found = _.get(data, [0], null);
    return found;
  } catch (error) {
    console.error("findUserAccountByMobile failed:", error);
    throw error;
  } finally {
    cmsApi.setToken(null);
  }
}

async function findUserAccountsByMobileAnyStatus(mobile: string) {
  const adminToken = getCmsAdminToken();
  await cmsApi.setToken(adminToken);

  const lookupValues = getMobileLookupValues(mobile);

  try {
    if (lookupValues.length === 0) return [];

    const data = await cmsApi.request(
      withRevalidate(
        // @ts-ignore
        readItems("users", {
          fields: [
            "id",
            "email",
            "status",
            "directus_user",
            "firstname",
            "lastname",
            "mobile",
            "thai_national_id_card",
          ],
          filter: {
            _or: lookupValues.map((value) => ({
              mobile: {
                _eq: value,
              },
            })),
          },
          limit: 2,
        }) as any,
        0
      )
    );

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("findUserAccountsByMobileAnyStatus failed:", error);
    throw error;
  } finally {
    cmsApi.setToken(null);
  }
}

async function findUserAccountByFullName(firstName: string, lastName: string) {
  const adminToken = getCmsAdminToken();
  await cmsApi.setToken(adminToken);

  const normalizedFirstName = firstName.trim();
  const normalizedLastName = lastName.trim();

  try {
    const data = await cmsApi.request(
      withRevalidate(
        // @ts-ignore
        readItems("users", {
          fields: [
            "id",
            "email",
            "status",
            "directus_user",
            "firstname",
            "lastname",
            "mobile",
            "thai_national_id_card",
          ],
          filter: {
            firstname: {
              _eq: normalizedFirstName,
            },
            lastname: {
              _eq: normalizedLastName,
            },
            status: {
              _eq: "published",
            },
          },
          limit: 2,
        }) as any,
        0
      )
    );

    if (Array.isArray(data) && data.length > 1) {
      throw new Error("พบผู้ใช้งานชื่อและนามสกุลซ้ำ ไม่สามารถเข้าสู่ระบบอัตโนมัติได้");
    }

    return _.get(data, [0], null);
  } catch (error) {
    console.error("findUserAccountByFullName failed:", error);
    throw error;
  } finally {
    cmsApi.setToken(null);
  }
}

async function findUserAccountByDirectusUserAnyStatus(directusUserId: string) {
  const adminToken = getCmsAdminToken();
  await cmsApi.setToken(adminToken);

  try {
    const data = await cmsApi.request(
      withRevalidate(
        // @ts-ignore
        readItems("users", {
          fields: [
            "id",
            "email",
            "status",
            "directus_user",
            "firstname",
            "lastname",
            "mobile",
            "thai_national_id_card",
          ],
          filter: {
            directus_user: {
              _eq: directusUserId,
            },
          },
          limit: 1,
        }) as any,
        0
      )
    );

    return _.get(data, [0], null);
  } catch (error) {
    console.error("findUserAccountByDirectusUserAnyStatus failed:", error);
    throw error;
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
  const normalizedEmail = normalizeEmail(email);

  const userAccount = await findUserAccountByEmail(normalizedEmail);
  if (!userAccount) return null;

  const directusUserId = typeof userAccount.directus_user === "string" ? userAccount.directus_user : null;

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

async function loginWithStaticTokenByUserAccount(userAccount: any, appCode: string) {
  if (!userAccount) return null;

  const directusUserId =
    typeof userAccount.directus_user === "string"
      ? userAccount.directus_user
      : typeof userAccount.directus_user?.id === "string"
      ? userAccount.directus_user.id
      : null;

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

  const normalizedEmail = normalizeEmail(profile.email);
  const normalizedMobile = profile.mobile ? normalizeMobile(profile.mobile) : "";

  const existingUser = await findUserAccountByEmail(normalizedEmail);
  if (existingUser) {
    return await loginWithStaticTokenByUserAccount(existingUser, appCode);
  }

  const existingUserAnyStatus = await findUserAccountByEmailAnyStatus(normalizedEmail);
  if (existingUserAnyStatus) {
    if (existingUserAnyStatus.status === "archived") {
      throw "ผู้ใช้งานนี้ถูกลบไปแล้ว";
    }

    return await loginWithStaticTokenByUserAccount(existingUserAnyStatus, appCode);
  }

  if (normalizedMobile) {
    const mobileMatches = await findUserAccountsByMobileAnyStatus(normalizedMobile);
    if (mobileMatches.length > 0) {
      throw "เบอร์โทรศัพท์นี้มีผู้ใช้งานอยู่แล้ว";
    }
  }

  const directusUsers = await checkUserExist(normalizedEmail);
  const existingDirectusUser = _.get(directusUsers, [0], null);

  const adminToken = getCmsAdminToken();
  await cmsApi.setToken(adminToken);

  let createDirectusUser;
  let shouldRemoveDirectusOnFailure = false;

  if (existingDirectusUser?.id) {
    if (existingDirectusUser.status === "archived") {
      cmsApi.setToken(null);
      throw "ผู้ใช้งานนี้ถูกลบไปแล้ว";
    }

    const accountByDirectusUser = await findUserAccountByDirectusUserAnyStatus(existingDirectusUser.id);
    if (accountByDirectusUser) {
      if (accountByDirectusUser.status === "archived") {
        cmsApi.setToken(null);
        throw "ผู้ใช้งานนี้ถูกลบไปแล้ว";
      }

      cmsApi.setToken(null);
      return await loginWithStaticTokenByUserAccount(accountByDirectusUser, appCode);
    }

    await cmsApi.setToken(adminToken);
    await updateUserDirectus(existingDirectusUser.id, {
      password: password.trim(),
      first_name: profile.firstName?.trim() || existingDirectusUser.first_name || "",
      last_name: profile.lastName?.trim() || existingDirectusUser.last_name || "",
      status: "active",
      role: existingDirectusUser.role || getUserRoleId(),
    });

    createDirectusUser = existingDirectusUser;
  } else {
    try {
      createDirectusUser = await createUserDirectus({
        email: normalizedEmail,
        password: password.trim(),
        first_name: profile.firstName?.trim() || "",
        last_name: profile.lastName?.trim() || "",
        language: "th-TH",
        status: "active",
        role: getUserRoleId(),
      });
      shouldRemoveDirectusOnFailure = true;
    } catch (error) {
      cmsApi.setToken(null);
      throw error;
    }
  }

  try {
    const applicationsRoleUserList = await getRoleUserAllAppication();
    const createUserAccountData = await createUserAccount({
      email: normalizedEmail,
      directus_user: createDirectusUser.id,
      status: "published",
      mobile: normalizedMobile || null,
      firstname: profile.firstName?.trim() || null,
      lastname: profile.lastName?.trim() || null,
      thai_national_id_card: null,
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
    if (shouldRemoveDirectusOnFailure) {
      await removeUserDirectus(createDirectusUser.id);
    }
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
  findUserAccountByFullName,
  findUserAccountByMobile,
  forgetPassword,
  normalizeMobile,
  getRoleUserAllAppication,
  listApplications,
  loginWithStaticTokenByEmail,
  loginWithStaticTokenByUserAccount,
  registerMTokenUser,
  registerUser,
  removeUser,
  removeUserDirectus,
  resetPassword,
};
