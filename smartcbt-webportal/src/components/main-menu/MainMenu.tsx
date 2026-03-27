"use client";

import {
  MainMenusType,
  apiMenu,
  carbonFootprintMenu,
  cbtThailandMenu,
  photoBankMenu,
  siaSroiMenu,
  travelMartMenu,
} from "@/models/main-menu";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PhBookOpen } from "../Icon";
import { NextLink } from "../Link";
import { useSession } from "../context-provider/AuthProvider";
import MainMenuGridItem from "./MainMenuGridItem";

type MainMenuProps = {
  isMTokenSession?: boolean;
};

const MainMenu = ({ isMTokenSession }: MainMenuProps) => {
  const t = useTranslations("common");

  const [mainMenus, setMainMenus] = useState<MainMenusType[]>([]);

  const { session } = useSession();
  const user = session?.user;
  const roles = user?.roles;
  const appCodes = roles?.map((r) => r.app_code);

  useEffect(() => {
    // 1. Wait for roles to load to avoid flickering or empty menus
    // If session is undefined, we are still loading
    if (!session || !user || !roles) return;

    let menus: MainMenusType[] = [];

    // NEW LOGIC: Filter based on isMTokenSession
    if (isMTokenSession) {
      // ONLY Carbon Footprint and Travel Mart for MToken
      if (appCodes?.includes("CARBON")) {
        menus.push(carbonFootprintMenu);
      }
      if (appCodes?.includes("BUSINESS")) {
        menus.push(travelMartMenu);
      }
    } else {
      // Default Logic for standard sessions
      menus.push(cbtThailandMenu);
      if (appCodes?.includes("CARBON")) {
        menus.push(carbonFootprintMenu);
      }
      if (appCodes?.includes("BUSINESS")) {
        menus.push(travelMartMenu);
      }
      if (appCodes?.includes("PHOTO")) {
        menus.push(photoBankMenu);
      }
      if (appCodes?.includes("APM")) {
        menus.push(apiMenu);
      }
      if (appCodes?.includes("SIA/SROI")) {
        menus.push(siaSroiMenu);
      }
    }

    setMainMenus(menus);
  }, [session, isMTokenSession]); // Use session as a stable dependency instead of new arrays

  return (
    <div className="px-10 py-20 md:px-4 md:py-32">
      <div className="flex w-full justify-end">
        <NextLink
          href={"/user-manual"}
          intent={"primaryOutlineButton"}
          size={"medium"}
          icon={<PhBookOpen className="h-5 w-5" />}
        >
          {t("mainMenu.buttonDocument")}
        </NextLink>
      </div>
      <div className="flex w-full flex-col items-center justify-center gap-6 md:gap-16">
        <h1 className="text-6xl font-semibold text-smart-cbt-green drop-shadow-lg md:text-9xl">{t("global.dasta")}</h1>
        <h3 className="text-center text-lg font-medium text-smart-cbt-green md:text-3xl">{t("global.slogan")}</h3>
        <div className="flex flex-row flex-wrap items-center justify-center gap-6">
          {mainMenus?.map((m) => (
            <MainMenuGridItem
              key={m.title}
              title={m.title}
              href={m.href}
              image={m.image}
              width={m.width}
              height={m.height}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
