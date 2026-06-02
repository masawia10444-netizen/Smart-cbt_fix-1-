import CBTLogo from "/public/images/web-portal/cbt-logo.jpg";
import Image from "@/components/image";
import {
  carbonMenu,
  defaultMenu,
  mainMenu,
  manageApiMenu,
  Menu,
  photoBankMenu,
  siaSroiMenu,
  simpleMenu,
  travelMartMenu,
  travelMartRegisterMenu,
} from "@/constants/menus";
import { Session } from "@/contexts/Auth.context";
import { cn } from "@/utils/cn";
import { getIsOnBoarding } from "@/utils/manage-api";
import { useTranslations } from "next-intl";
import Link from "next-intl/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import Avatar from "./Avatar";
import { useSession } from "./context-provider/AuthProvider";
import { HamburgerIcon } from "./Icon";
import Languages from "./Languages";
import { NextLink } from "./Link";
import { MobileMenu } from "./MobileMenu";
import TravelMartDetailProjectDropdown from "./travel-mart/TravelMartDetailProjectDropdown";

type NavigationBarProps = {
  className?: string;
  isMobileOpened: boolean;
  onToggle: () => void;
  setRoleTravelMartMenu?: (role: string) => void;
};

type MenuItemProps = {
  type: string;
  title: string;
  session: Session | null;
  href?: string;
  setRoleTravelMartMenu?: (role: string) => void;
  hideLogout?: boolean;
};

export const MenuItem = ({ type, title, session, href, setRoleTravelMartMenu, hideLogout }: MenuItemProps) => {
  const pathname = usePathname();
  const isMapiActiveMenu = href?.includes("/mapi/developer") && pathname?.includes("/mapi/developer");
  switch (type) {
    case "language":
      return <Languages />;
    case "profile":
      if (session)
        return (
          <Avatar
            name={session?.user?.first_name ?? ""}
            image=""
            setRoleTravelMartMenu={setRoleTravelMartMenu}
            hideLogout={hideLogout}
          />
        );
      else return <></>;
    case "login":
      if (session) return <></>;
      else
        return (
          <Link href={href ?? "/"}>
            <div
              className={`text-sm font-medium text-white hover:cursor-pointer group-[.bg-transparent]:text-smart-cbt-dark-green`}
            >
              {title}
            </div>
          </Link>
        );
    case "register":
      if (session) return <></>;
      else
        return (
          <Link href={href ?? "/"}>
            <div
              className={`rounded-lg bg-white px-4 py-2 text-sm font-medium text-smart-cbt-green hover:cursor-pointer`}
            >
              {title}
            </div>
          </Link>
        );
    case "detailProjects":
      return <TravelMartDetailProjectDropdown title={title} />;
    default:
      return (
        <Link
          href={href ?? "/"}
          className={`flex h-full items-center group-[.bg-transparent]:text-smart-cbt-dark-green lg:px-2 ${
            isMapiActiveMenu ? "text-smart-cbt-dark-green lg:bg-smart-cbt-border-green" : "text-white"
          }`}
        >
          <div className={`text-sm font-medium hover:cursor-pointer`}>{title}</div>
        </Link>
      );
  }
};

export default function NavigationBar({
  onToggle,
  isMobileOpened,
  className,
  setRoleTravelMartMenu,
}: NavigationBarProps) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const [showMenus, setShowMenus] = useState<Menu[]>([]);

  const { session, isMTokenSession } = useSession();
  const isOnboardingApm = useMemo(() => session && getIsOnBoarding(session?.user?.roles), [session]);

  useEffect(() => {
    let menus;
    if (pathname.includes("photo-bank")) {
      menus = photoBankMenu.concat(simpleMenu);
    } else if (pathname.includes("travel-mart")) {
      menus = travelMartMenu.concat(simpleMenu);
    } else if (pathname.includes("sia-sroi")) {
      menus = siaSroiMenu.concat(simpleMenu);
    } else if (pathname.includes("carbon-footprint")) {
      menus = carbonMenu.concat(simpleMenu);
    } else if (pathname.includes("mapi")) {
      menus = manageApiMenu.concat(simpleMenu);
    } else if (
      pathname.includes("login") ||
      pathname == "/register" ||
      pathname == "/en/register" ||
      pathname.includes("forgot-password") ||
      pathname.includes("main-menus")
    ) {
      menus = mainMenu.concat(simpleMenu);
    } else {
      menus = defaultMenu;
    }
    setShowMenus(menus);
  }, [pathname]);

  function isTravelMartPath() {
    const pathTravelMart = pathname.startsWith("/travel-mart");
    const pathTravelMartEn = pathname.startsWith("/en/travel-mart");
    return pathTravelMart || pathTravelMartEn;
  }

  const registerTravelMartButton = () => {
    const user = session?.user;
    const userOrganizations = user?.organizations;
    const userCommunities = user?.communities;
    const check = isTravelMartPath() ? !!userCommunities || !!userOrganizations : true;

    return (
      <>
        {!check && (
          <Link key={"registerTravelMart"} href={"/travel-mart/register/portal"}>
            <div
              className={`flex h-14 items-center bg-white px-4 text-sm font-medium text-smart-cbt-green hover:cursor-pointer`}
            >
              {t("menus.register")}
            </div>
          </Link>
        )}
      </>
    );
  };

  const photographerMenu = () => {
    const roles = session?.user?.roles.map((r) => r.role);
    const isPhotoBankPath = pathname.startsWith("/photo-bank") || pathname.startsWith("/en/photo-bank");
    if (!isPhotoBankPath || !roles) return null;
    const isPhotographer = roles.includes("photographer");
    return (
      <div className="flex flex-row gap-4">
        {isPhotographer ? (
          <NextLink intent="primaryButton" href="/photo-bank/my-albums">
            {t("photoBank.main.toolbarMenus.uploadPhoto")}
          </NextLink>
        ) : (
          <NextLink intent="whiteButton" href="/profile/photo-bank">
            {t("photoBank.main.toolbarMenus.registerAsPhotographer")}
          </NextLink>
        )}
      </div>
    );
  };

  return (
    <Fragment>
      <nav className={cn("fixed left-0 right-0 top-0 z-40 h-14 bg-white lg:bg-smart-cbt-green shadow-sm lg:shadow-none", className)}>
        <div className="flex h-14 items-center justify-between px-4 lg:container lg:mx-auto lg:px-0">
          <Link className="hover:cursor-pointer" href={"/"}>
            <Image src={CBTLogo} alt="logo" height={56} style={{ filter: "grayscale(100%)" }} />
          </Link>
          <button className="block lg:hidden " onClick={onToggle}>
            <HamburgerIcon className="h-8 w-8 text-smart-cbt-dark-green lg:text-white group-[.bg-transparent]:text-smart-cbt-dark-green" />
          </button>
          <div className="hidden h-full w-auto flex-row items-center gap-4 lg:flex">
            {showMenus.map((m) => {
              return (
                <MenuItem
                  key={m.key}
                  type={m.key}
                  title={t(m.title)}
                  session={session}
                  href={m.href}
                  setRoleTravelMartMenu={setRoleTravelMartMenu}
                  hideLogout={isMTokenSession}
                />
                // <Fragment key={m.key}>
                //   {renderMenus(m.key, t(m.title), session, m.href, setRoleTravelMartMenu)}
                // </Fragment>
              );
            })}
            {registerTravelMartButton()}
            {photographerMenu()}
            {pathname.includes("/mapi") && !isOnboardingApm && !isMTokenSession && (
              <div className="flex flex-row gap-4">
                <NextLink
                  intent="whiteButton"
                  className="group-[.bg-transparent]:bg-smart-cbt-green group-[.bg-transparent]:text-white"
                  href="/mapi/register"
                >
                  {t("menus.registerManageApi")}
                </NextLink>
              </div>
            )}
          </div>
        </div>
      </nav>
      <MobileMenu
        session={session}
        menus={isTravelMartPath() ? showMenus.concat(travelMartRegisterMenu) : showMenus}
        isMobileOpened={isMobileOpened}
        onToggle={onToggle}
        hideLogout={isMTokenSession}
      />
    </Fragment>
  );
}
