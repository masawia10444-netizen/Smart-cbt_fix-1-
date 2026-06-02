"use client";

import { Menu } from "@/constants/menus";
import { useTranslations } from "next-intl";
import { XCircleIcon } from "./Icon";
import { MenuItem } from "./NavigationBar";

interface MenusProps {
  onToggle: () => void;
  isMobileOpened: boolean;
  session: any;
  menus: Menu[];
  hideLogout?: boolean;
}

export const MobileMenu = ({ onToggle, isMobileOpened, menus, session, hideLogout }: MenusProps) => {
  const t = useTranslations("common");

  return (
    <div>
      {isMobileOpened && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden">
          <div className="fixed left-auto right-0 z-50 h-screen w-[42vw] min-w-[260px] bg-smart-cbt-green shadow-xl overflow-y-auto">
            <div className="px-6 lg:px-16 py-8 lg:py-10 min-h-full">
              <div className="flex flex-col gap-10">
                <button className="flex justify-end" onClick={onToggle}>
                  <XCircleIcon className="h-8 w-8 fill-smart-cbt-green text-white" />
                </button>
                <ul className="flex list-none flex-col items-start gap-6">
                  {menus?.map((m) => (
                    <MenuItem
                      key={m.key}
                      type={m.key}
                      title={t(m.title)}
                      session={session}
                      href={m.href}
                      hideLogout={hideLogout}
                    />
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
