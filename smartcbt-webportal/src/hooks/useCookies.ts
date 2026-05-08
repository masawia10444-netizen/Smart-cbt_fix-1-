

import { cookies } from "next/headers";
import { MTOKEN_SESSION_KEY } from "@/utils/token";

function useCookies() {
  const cookieStore = cookies();

  const token = cookieStore.get("NEXT_TOKEN")?.value;
  const appCode = cookieStore.get("APP_CODE")?.value;
  const isMTokenSession = cookieStore.get(MTOKEN_SESSION_KEY)?.value === "true";

  return { token: token ?? "", appCode: appCode ?? "", isMTokenSession };
}

export default useCookies;
