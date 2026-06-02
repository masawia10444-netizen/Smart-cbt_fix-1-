import { decodeJwt } from "jose";
import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

const locales = ["en", "th"];
const publicPages = [
  "/monitoring",
  "/reset-password",
  "/forgot-password",
  "/mapi",
  "/test/website/travel-mart/business-schedule",
  "/test/website/authen",
  "/test/website/travel-mart/on-boarding",
];

const unAuthenPages = ["/login", "/register", "/mapi/register", "/mapi/login"];

const intlMiddleware = createIntlMiddleware({
  // A list of all locales that are supported
  locales,
  // If this locale is matched, pathnames work without a prefix (e.g. `/about`)
  defaultLocale: "th",
  // By setting this to `false`, the `accept-language` header will no longer be used for locale detection.
  // We use this so the first time the user lands on the website (/) it'll default the language to th.
  localeDetection: false,
});

export default async function middleware(req: NextRequest) {
  const regexPattern = `^(/(${locales.join("|")}))?(${publicPages.join("|")})/?$`;
  const publicPathnameRegex = new RegExp(regexPattern, "i");
  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname);

  const regexUnauthenPattern = `^(/(${locales.join("|")}))?(${unAuthenPages.join("|")})/?$`;
  const unauthenPathnameRegex = new RegExp(regexUnauthenPattern, "i");
  const isUnAuthenPage = unauthenPathnameRegex.test(req.nextUrl.pathname);

  const loginUrl = new URL("/login", req.nextUrl);
  loginUrl.search = req.nextUrl.search;
  const response = NextResponse.redirect(loginUrl);
  const removeTokens = (targetResponse: NextResponse) => {
    targetResponse.cookies.delete("NEXT_TOKEN");
    targetResponse.cookies.delete("NEXT_REFRESH_TOKEN");
    targetResponse.cookies.delete("APP_CODE");
    targetResponse.cookies.delete("MTOKEN_SESSION");
  };

  const token = req.cookies.get("NEXT_TOKEN")?.value;
  const isMTokenSession = req.cookies.get("MTOKEN_SESSION")?.value === "true";
  const hasMTokenParam =
    req.nextUrl.searchParams.has("mToken") ||
    req.nextUrl.searchParams.has("MToken") ||
    req.nextUrl.searchParams.has("mtoken");
  const hasMTokenLoginParams = req.nextUrl.searchParams.has("appId") && hasMTokenParam;
  const isMTokenLogin = req.nextUrl.pathname.includes("/login") && hasMTokenLoginParams;

  if (!isMTokenLogin && hasMTokenLoginParams) {
    const mTokenLoginUrl = new URL("/login", req.nextUrl);
    mTokenLoginUrl.search = req.nextUrl.search;
    const mTokenRedirectResponse = NextResponse.redirect(mTokenLoginUrl);
    removeTokens(mTokenRedirectResponse);
    return mTokenRedirectResponse;
  }

  if (isMTokenLogin) {
    const intlResponse = intlMiddleware(req);
    removeTokens(intlResponse);
    return intlResponse;
  }

  if (token && isUnAuthenPage) {
    return NextResponse.redirect(new URL("/main-menus", req.url));
  }
  
  // Route restriction for mToken users
  if (token && isMTokenSession) {
    const restrictedPaths = ["/photo-bank", "/sia-sroi", "/mapi"];
    const isRestricted = restrictedPaths.some(p => req.nextUrl.pathname.includes(p));
    
    if (isRestricted) {
      return NextResponse.redirect(new URL("/main-menus", req.url));
    }
  }

  if (isPublicPage || isUnAuthenPage) {
    return intlMiddleware(req);
  } else {
    // Authorization
    const authorized = token != null;

    if (authorized) {
      // Check Token Expired (skip expiry check for non-JWT/static tokens)
      try {
        const jwtDecode = decodeJwt(token);
        const currentTimestamp = Math.floor(Date.now() / 1000);

        const tokenExpired = (jwtDecode.exp ?? 0) < currentTimestamp;
        if (tokenExpired) {
        // const refreshTokenCookie = req.cookies.get("NEXT_REFRESH_TOKEN")?.value;
        // const appCode = req.cookies.get("APP_CODE")?.value;

        // if (refreshTokenCookie && appCode) {
        //   try {
        //     const newToken = await cmsApi.request(refresh(refreshTokenCookie, "json"));
        //     // setCookies(newToken?.access_token, newToken.refresh_token, newToken.expires, appCode);
        //     return intlMiddleware(req);
        //   } catch (error) {
        //     console.log(error);
        //     removeTokens();
        //     return response;
        //   }
        // } else {
          console.log("Token Expired");
          removeTokens(response);
          return response;
          // }
        }
      } catch (_error) {
        // static token from mToken flow
      }
      return intlMiddleware(req);
    } else {
      return response;
    }
  }
}

export const config = {
  // Skip all paths that should not be internationalized. This example skips the
  // folders "api", "_next" and all files with an extension (e.g. favicon.ico)
  matcher: [
    "/((?!api|robots.txt|_next|.*\\..*).*)",
    "/((?!sitemap.xml|sitemap-0.xml|sitemap-1.xml))",
    "/",
    "/(th|en)/:path*",
  ],
};
