import { components } from "@/utils/cms/cms-type";

type DirectusFiles = components["schemas"]["Files"];

export function getCmsURL(path = "") {
  // console.log("getCmsURL", process.env.NEXT_PUBLIC_CMS_URL);
  return `${process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:8055"}${path}`;
}

export function getApiGatewayUrl(path = "") {
  // console.log("getCmsURL", process.env.NEXT_PUBLIC_CMS_URL);
  return `${process.env.NEXT_PUBLIC_API_GATEWAY || "http://localhost:8055"}${path}`;
}

export function getApiPrometheusUrl(path = "") {
  // console.log("getCmsURL", process.env.NEXT_PUBLIC_CMS_URL);
  return `${process.env.NEXT_PUBLIC_API_PROMETHEUS_GATEWAY || "http://localhost:9090"}${path}`;
}

export function getRateLimit() {
  // console.log("getCmsURL", process.env.NEXT_PUBLIC_CMS_URL);
  return `${process.env.NEXT_PUBLIC_API_GATEWAY_LIMIT || 5000}`;
}

export function getCmsMedia(url: string | DirectusFiles | null | undefined) {
  if (url == null || typeof url === undefined) {
    return "";
  }
  let localUrl = typeof url === "string" ? url : String(url.id);

  // Return the full URL if the media is hosted on an external provider
  if (localUrl.startsWith("http") || localUrl.startsWith("//")) {
    return localUrl;
  }

  // Otherwise prepend the URL path with the other FALLBACK URL
  return `${getCmsURL()}/assets/${url}`;
}

export function getUserRoleId() {
  // console.log("getCmsURL", process.env.NEXT_PUBLIC_CMS_URL);
  return process.env.NEXT_PUBLIC_USER_ROLE_ID || undefined;
}

export function getApiRoleId() {
  // console.log("getCmsURL", process.env.NEXT_PUBLIC_CMS_URL);
  return process.env.NEXT_PUBLIC_API_ROLE_ID || undefined;
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("th-TH", options);
}

export function getJwtSecretKey() {
  return process.env.JWT_SECRET || "1qFck2P7hYmRn7zKqTMh7EQjL1AcD49H";
}

export function getJwtExpiredIn() {
  return process.env.JWT_EXPIRED_IN || "15m";
}

export function getCmsAdminToken() {
  return process.env.CMS_ADMIN_TOKEN || "";
}

// ADDS DELAY TO SIMULATE SLOW API REMOVE FOR PRODUCTION
export const delay = (time: number) => new Promise((resolve) => setTimeout(() => resolve(1), time));

export const validatePhone = ({ target }: any) => {
  // Remove any characters that are not digits
  target.value = target.value.replace(/\D/g, "");

  // If the value length is greater than 10, truncate it
  if (target.value.length > 10) {
    target.value = target.value.substring(0, 10);
  }
};
