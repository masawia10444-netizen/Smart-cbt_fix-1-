"use client";

import { DeleteIcon2, UserIcon } from "@/components/Icon";
import NavigationBar from "@/components/NavigationBar";
import SideBar from "@/components/Sidebar";
import { ArrowRightOnRectangleIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "../../(index)/(unauthenticated)/login/actions";
import { useSession } from "@/components/context-provider/AuthProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const t = useTranslations("common");
  const [isMobileOpened, setIsMobileOpened] = useState(false);
  const { isMTokenSession } = useSession();

  const menuItems: React.ComponentProps<typeof SideBar>["menuItems"] = [
    {
      key: "profile",
      href: `/profile/user`,
      label: t("profile.menus.profile"),
      icon: <UserIcon />,
    },
    {
      key: "profile-travel-mart",
      href: `/profile/travel`,
      label: t("profile.menus.travelMartUser"),
      icon: <UserIcon />,
    },
    {
      key: "profile-photo-bank",
      href: `/profile/photo-bank`,
      label: t("profile.menus.photoBankUser"),
      icon: <PhotoIcon className="h-6 w-6" />,
    },
    {
      key: "profile-api",
      href: `/profile/api`,
      label: t("profile.menus.api"),
      icon: <UserIcon />,
    },
    // {
    //   key: "mapi-removeAccount",
    //   href: `/profile/remove-account`,
    //   label: t("profile.menus.removeAccount"),
    //   icon: <DeleteIcon2 />,
    // },
  ];

  if (!isMTokenSession) {
    menuItems.push({
      key: "logout",
      label: t("profile.menus.logout"),
      icon: <ArrowRightOnRectangleIcon className="h-6 w-6" />,
      onClick: () => handleLogout(),
    });
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const toggleMobileMenu = () => {
    setIsMobileOpened((opened) => !opened);
  };

  return (
    <>
      <SideBar menuItems={menuItems} />
      <div className="lg:pl-64 pt-14 lg:pt-0 flex flex-col min-h-screen bg-[#EDFFF4]">
        <NavigationBar onToggle={toggleMobileMenu} isMobileOpened={isMobileOpened} />
        <div className="relative flex-1 bg-[#EDFFF4] pt-16 lg:pt-14">{children}</div>
      </div>
    </>
  );
}
