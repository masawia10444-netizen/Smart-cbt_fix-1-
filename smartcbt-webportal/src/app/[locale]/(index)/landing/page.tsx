"use client";

import NavigationBar from "@/components/NavigationBar";
import WebPortal from "@/components/web-portal/WebPortal";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileOpened, setIsMobileOpened] = useState(false);

  const [scrollPosition, setScrollPosition] = useState(0);

  const handleScroll = () => {
    const position = window.pageYOffset;
    setScrollPosition(position);
  };

  useEffect(() => {
    const appId = searchParams.get("appId");
    const mToken = searchParams.get("mToken") || searchParams.get("MToken") || searchParams.get("mtoken");

    if (appId && mToken) {
      router.replace(`/login?${searchParams.toString()}`);
    }
  }, [router, searchParams]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileOpened((opened) => !opened);
  };

  return (
    <Fragment>
      <NavigationBar
        onToggle={toggleMobileMenu}
        className={scrollPosition == 0 ? "bg-transparent" : ""}
        isMobileOpened={isMobileOpened}
      />
      <WebPortal />
    </Fragment>
  );
}
