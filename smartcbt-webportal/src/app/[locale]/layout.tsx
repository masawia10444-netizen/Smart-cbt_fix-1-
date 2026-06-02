import "react-datepicker/dist/react-datepicker.css";
import "react-toastify/dist/ReactToastify.css";
import "../globals.css";

import { useLocale } from "next-intl";
import { notFound } from "next/navigation";

import RootLayout from "@/components/RootLayout";
import TagManager from "@/components/tag-manager";
import { promptFont } from "@/config/font";
import { fetchConfigGlobal } from "@/utils/cms/adapters/website/config_global";
import { getCmsMedia } from "@/utils/cms/api-helpers";
import { Collection } from "@/utils/cms/cms-type";
import { cn } from "@/utils/cn";
import { getSession } from "@/utils/session";
import { Metadata } from "next";
import Script from "next/script";
import { ToastContainer } from "react-toastify";

// CMS

type ConfigGlobalTranslations = Collection["config_global_translations"];

export const runtime = "edge";

const FALLBACK_SEO = {
  title: "SMARTCBT",
  description: "Designated Areas for Sustainable Tourism Administration",
};

// Static metadata
// export const metadata: Metadata = {
//   title: "SMARTCBT - DASTA",
//   description: "Designated Areas for Sustainable Tourism Administration",
// };

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// Dynamic metadata
export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  // export async function generateMetadata({ params, searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  // console.log("generateMetadata...");
  // params.lang = "th"; // force lang "th"
  const locale = useLocale();
  // console.log("locale", locale);
  // const projects = await fetchProjects();
  // await console.log("projects", projects);

  const cfgGlobals = await fetchConfigGlobal(locale);
  // await console.log("globals", cfgGlobals);

  if (!cfgGlobals.translations || cfgGlobals.translations.length <= 0) {
    // console.log("globals.translations - FALLBACK");
    return FALLBACK_SEO;
  }
  const data = cfgGlobals.translations[0] as ConfigGlobalTranslations;
  const url = getCmsMedia(String(cfgGlobals.favicon));
  return {
    title: {
      template: `%s | ${data?.title ?? "SMARTCBT"}`,
      default: data.title || "SMARTCBT",
    },
    description: data.description,
    openGraph: { images: getCmsMedia(String(data.og_image) || "") },
    icons: {
      icon: [url],
    },
  };
}

export default async function RootLayoutPage({ children, params }: { children: React.ReactNode; params: any }) {
  const isDev = process.env.NODE_ENV === "development" ? true : false;
  // const [provinces, districts, subdistricts, communities, termConditions, policies] = await Promise.all([
  //   fetchProvinces(),
  //   fetchDistricts(),
  //   fetchSubDistricts(),
  //   fetchCommunities(),
  //   getTermConditions(),
  //   getPolicies(),
  // ]);

  const locale = useLocale();
  // Show a 404 error if the user requests an unknown locale
  if (params.locale !== locale) {
    notFound();
  }
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  const session = await getSession();

  return (
    <html lang={locale} className="h-full">
      <body className={cn("flex h-full flex-col", isDev && "debug-screens", promptFont.className)}>
        <RootLayout
          messages={messages}
          provinces={[]}
          districts={[]}
          subdistricts={[]}
          policies={[]}
          termConditions={[]}
          communities={[]}
          session={session ?? null}
        >
          {children}
          <ToastContainer />
        </RootLayout>
        <Script src="https://czp.dga.or.th/cportal/sdk/iu/v4/sdk.js" strategy="afterInteractive" />
        <Script src="https://unpkg.com/vconsole@latest/dist/vconsole.min.js" strategy="afterInteractive" />
        <Script id="smartcbt-vconsole" strategy="afterInteractive">
          {`
            (function initSmartCbtVConsole() {
              if (typeof window === "undefined" || window.__SMARTCBT_VCONSOLE__) {
                return;
              }

              if (typeof window.VConsole === "function") {
                window.__SMARTCBT_VCONSOLE__ = new window.VConsole();
                return;
              }

              window.setTimeout(initSmartCbtVConsole, 100);
            })();
          `}
        </Script>
        <TagManager />
      </body>
    </html>
  );
}

// export default function Page({ params, searchParams }: Props) {}
