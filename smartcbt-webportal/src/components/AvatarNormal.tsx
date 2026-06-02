import { Menu, Transition } from "@headlessui/react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import Image from "@/components/image";
import { Fragment } from "react";
import { NextLink } from "./Link";

type AvatarNormalProps = {
  image?: string;
  name: string;
  handleLogout: () => void;
  hideLogout?: boolean;
};

const AvatarNormal = ({ name, image, handleLogout, hideLogout }: AvatarNormalProps) => {
  const t = useTranslations("common");

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
          <Menu.Item>
            <div className="relative flex flex-col gap-2 py-2">
              <div className="flex items-center gap-4">
                <div className="w-fit">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full  bg-smart-cbt-orange-2 text-center text-xl uppercase text-black">
                    {image ? (
                      <Image src={image} alt={name} fill style={{ objectFit: "cover" }} className="rounded-full" />
                    ) : (
                      (name ?? "")
                        .split(" ")
                        .slice(0, 2)
                        .map((x) => x.charAt(0).toUpperCase())
                        .join("")
                    )}
                  </div>
                </div>
                <span className="truncate">{name && name != "" ? name : t("profile.user.notHaveName")}</span>
              </div>
            </div>
          </Menu.Item>
          <Menu.Item>
            <div className="flex justify-start py-2">
              <NextLink
                href="/profile/user"
                className={`flex w-fit items-center px-2 py-2 text-sm`}
                intent={"primaryButton"}
              >
                {t("global.editProfile")}
              </NextLink>
            </div>
          </Menu.Item>
          {!hideLogout && (
            <Menu.Item>
              <button className={`flex w-full items-center gap-2 py-2 text-sm`} onClick={handleLogout}>
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

export default AvatarNormal;
