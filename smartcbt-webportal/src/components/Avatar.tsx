import { logout } from "@/app/[locale]/(index)/(unauthenticated)/login/actions";
import Image from "@/components/image";
import { Menu } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import AvatarNormal from "./AvatarNormal";
import { ArrowDownSFill } from "./Icon";
import { useSession } from "./context-provider/AuthProvider";
import AvatarTravelMart from "./travel-mart/AvatarTravelMart";

type AvatarProps = {
  image?: string;
  setRoleTravelMartMenu?: (role: string) => void;
  name: string;
  hideLogout?: boolean;
};

const Avatar = (props: AvatarProps) => {
  const { name, image, setRoleTravelMartMenu, hideLogout } = props;

  const t = useTranslations("common");
  const router = useRouter();
  const path = usePathname();

  const { session } = useSession();
  const user = session?.user;

  const rolesBusiness = user?.roles.filter((r) => r.app_code === "BUSINESS" && r.role !== "user") ?? [];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full justify-center rounded-md font-medium text-white">
          <div className="relative flex flex-row items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-smart-cbt-orange-2  text-center text-xl uppercase text-black">
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
            <div className="text-sm font-medium hover:cursor-pointer">
              {name && name != "" ? name : t("profile.user.notHaveName")}
            </div>
            <ArrowDownSFill className="h-5 w-5" />
          </div>
        </Menu.Button>
      </div>
      {path.includes("travel-mart") && rolesBusiness?.length > 0 ? (
        <AvatarTravelMart
          setRoleTravelMartMenu={setRoleTravelMartMenu}
          handleLogout={handleLogout}
          rolesBusiness={rolesBusiness}
          hideLogout={hideLogout}
        />
      ) : (
        <AvatarNormal handleLogout={handleLogout} {...props} hideLogout={hideLogout} />
      )}
    </Menu>
  );
};

export default Avatar;
