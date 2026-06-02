import { Menu, Transition } from "@headlessui/react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { Fragment, useEffect } from "react";
import { NextLink } from "../Link";

type AvatarTravelMartProps = {
  handleLogout: () => void;
  hideLogout?: boolean;
  setRoleTravelMartMenu?: (role: string) => void;
  rolesBusiness: {
    id: string;
    app_code: string;
    app_title: string;
    app_title_en: string;
    role: string;
    role_title: string;
    firstname: string | null;
    lastname: string | null;
  }[];
};

const AvatarTravelMart = ({ handleLogout, hideLogout, rolesBusiness, setRoleTravelMartMenu }: AvatarTravelMartProps) => {
  const t = useTranslations("common");

  useEffect(() => {
    if (!setRoleTravelMartMenu) return;
    const roleCommunity = rolesBusiness.find((r) => r.role == "community");
    const roleOrganization = rolesBusiness.find((r) => r.role == "organization");
    const roleGuide = rolesBusiness.find((r) => r.role == "guide");

    if (roleCommunity) {
      setRoleTravelMartMenu("community");
      return;
    } else if (roleOrganization) {
      setRoleTravelMartMenu("organization");
      return;
    } else if (roleGuide) {
      setRoleTravelMartMenu("guide");
      return;
    }
  }, []);

  return (
    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Menu.Items className="absolute left-0 lg:left-auto lg:right-0 mt-2 w-56 origin-top-left lg:origin-top-right gap-10 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50">
        <div className="flex flex-col divide-y-2 divide-gray-200 px-6 py-2">
          {rolesBusiness.map((rb) => {
            return (
              <Menu.Item key={rb.role}>
                <button
                  onClick={() => {
                    if (setRoleTravelMartMenu) setRoleTravelMartMenu(rb.role);
                  }}
                  className="relative flex flex-col gap-2 py-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-fit">
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-smart-cbt-orange-2 text-center text-xl uppercase text-black">
                        {/* {image ? (
                      <Image src={image} alt={name} fill style={{ objectFit: "cover" }} className="rounded-full" />
                    ) : */}
                        {(rb.firstname ?? "")
                          .split(" ")
                          .slice(0, 2)
                          .map((x) => x.charAt(0).toUpperCase())
                          .join("")}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="truncate">{t(`travelMart.roleMenus.${rb.role}`)}</span>
                      <span className="truncate text-smart-cbt-medium-grey">
                        {rb.firstname && rb.firstname != "" ? rb.firstname : t("profile.user.notHaveName")}
                      </span>
                    </div>
                  </div>
                </button>
              </Menu.Item>
            );
          })}
          <Menu.Item>
            <div className="flex justify-start py-4">
              <NextLink
                href="/travel-mart/profile"
                className={`flex w-fit items-center px-2 py-2 text-sm`}
                intent={"primaryButton"}
              >
                {t("global.editProfile")}
              </NextLink>
            </div>
          </Menu.Item>
          {!hideLogout && (
            <Menu.Item>
              <button className={`flex w-full items-center gap-2 py-4 text-sm`} onClick={handleLogout}>
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
                {t("global.logout")}
              </button>
            </Menu.Item>
          )}
        </div>
      </Menu.Items>
    </Transition>
  );
};

export default AvatarTravelMart;
