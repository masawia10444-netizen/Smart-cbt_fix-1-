"use client";

import { Manual } from "@/models/manual";
import { useTranslations } from "next-intl";
import UserManualMenu from "./UserManualMenu";

type UserManualProps = {
  manuals: Manual[];
};

const UserManual = (props: UserManualProps) => {
  const t = useTranslations("common");

  const getLogoByAppCode = (appCode?: string | null) => {
    if (!appCode) return "";
    switch (appCode) {
      case "SIA/SROI":
        return `/images/shared/sia-sroi.png`;
      case "CARBON":
        return `/images/shared/carbon-footprint.png`;
      case "BUSINESS":
        return `/images/shared/travel-mart.png`;
      case "PHOTO":
        return `/images/shared/photo-bank.png`;
      case "APM":
        return `/images/shared/api.png`;
      case "CBT":
        return `/images/shared/cbt-thailand.png`;
      default:
        return "";
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-20 px-10 pt-32 pb-20 md:px-4 md:py-32">
      <h1 className="text-5xl font-semibold text-smart-cbt-dark-green drop-shadow-lg md:text-5xl">
        {t("userManual.title")}
      </h1>
      <div className="grid grid-cols-1 items-center gap-x-4 gap-y-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-x-8 xl:gap-y-12">
        {props.manuals.map((manual) => (
          <UserManualMenu
            key={manual.id}
            title={manual.title ?? ""}
            width={manual.width ?? 80}
            height={manual.width ?? 80}
            href={
              manual.href
                ? manual.href
                : manual.application_manual?.url
                ? `${process.env.NEXT_PUBLIC_CMS_URL}/assets/${manual.application_manual?.url}`
                : ""
            }
            image={getLogoByAppCode(manual.application_code)}
            updatedAt={manual.date_updated ?? ""}
          />
        ))}
      </div>
    </div>
  );
};

export default UserManual;
