"use client";

import Image from "@/components/image";
import { cn } from "@/utils/cn";
import { useTranslations } from "next-intl";
import Link from "next-intl/link";

type UserManualMenuProps = {
  title: string;
  image: string;
  width?: number;
  height?: number;
  href: string;
  updatedAt: string;
  className?: string;
  disabled?: boolean;
};

const UserManualMenu: React.FC<UserManualMenuProps> = ({
  title,
  image,
  width = 80,
  height = 80,
  href,
  updatedAt,
  className,
  disabled,
}: UserManualMenuProps) => {
  const t = useTranslations("common");
  return (
    <Link className={disabled ? "pointer-events-none" : ""} href={href ?? ""} aria-disabled={disabled}>
      <div
        className={cn(
          // "flex h-[200px] flex-row items-center gap-7 rounded-2xl bg-white p-8 drop-shadow-xl hover:cursor-pointer", // Original
          "flex min-h-[140px] h-auto flex-row items-center gap-7 rounded-2xl bg-white p-6 md:p-8 drop-shadow-xl hover:cursor-pointer",
          disabled && "bg-smart-cbt-very-light-grey hover:cursor-not-allowed",
          className
        )}
      >
        <Image
          src={image}
          alt={title}
          width={width}
          height={height}
          style={{
            objectFit: "contain",
          }}
        />
        <div className="flex flex-col gap-4">
          <span className="grow whitespace-pre-line text-md font-medium">{title}</span>
          {updatedAt && (
            <span>
              {t("global.updatedAt")}:{" "}
              {updatedAt
                ? new Date(updatedAt).toLocaleDateString("th-TH", { year: "numeric", month: "2-digit", day: "numeric" })
                : "-"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default UserManualMenu;
