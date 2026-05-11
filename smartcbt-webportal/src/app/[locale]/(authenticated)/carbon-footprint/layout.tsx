"use client";

import NavigationBar from "@/components/NavigationBar";
import { Fragment, useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileOpened, setIsMobileOpened] = useState(false);
  const [isProfileOpened, setIsProfileOpened] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileOpened((opened) => !opened);
  };

  return (
    <Fragment>
      <NavigationBar onToggle={toggleMobileMenu} isMobileOpened={isMobileOpened} />
      <div className="relative h-full px-4 pb-6 pt-20 md:mx-auto">{children}</div>
    </Fragment>
  );
}
