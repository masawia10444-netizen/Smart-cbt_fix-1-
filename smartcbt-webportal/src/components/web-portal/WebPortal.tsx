"use client";

import Image from "@/components/image";
import { useTranslations } from "next-intl";
import React from "react";
import Footer from "../Footer";
import { NextLink } from "../Link";

const ItemContainer = ({
  children,
  textLeft,
  isGreen,
}: {
  children: React.ReactNode;
  textLeft?: boolean;
  isGreen?: boolean;
}) => (
  <div className={`${isGreen ? "bg-[#ECFFF4]" : "bg-white"} px-5 py-10 md:px-0`}>
    <div className={`text-center text-smart-cbt-dark-green md:container md:mx-auto ${textLeft ? "md:text-left" : ""}`}>
      {children}
    </div>
  </div>
);

const ItemHeader = ({ title, description }: { title: string; description: string }) => (
  <>
    <h2 className="text-4xl font-semibold lg:text-6xl"> {title}</h2>
    <p className="font-thin lg:text-lg">{description}</p>
  </>
);

const ItemImage = ({ src, alt, isFlex }: { src: string; alt: string; isFlex?: boolean }) => (
  <div className={`relative h-[300px] w-full md:h-[400px] ${isFlex ? "md:flex-1" : ""} lg:h-[50vh] 3xl:h-[30vh]`}>
    <Image src={src} fill alt={alt} style={{ objectFit: "contain" }} />
  </div>
);

const WebPortal = () => {
  const t = useTranslations("common");

  return (
    <div>
      <div className="relative h-[300px] w-full md:h-[400px] lg:h-[65vh]">
        <div className="container absolute left-1/2 top-1/2 z-20 mx-auto -translate-x-1/2 -translate-y-1/2 text-white">
          <div className="flex flex-col items-center gap-4 text-white md:gap-10">
            <h1 className="text-6xl font-semibold drop-shadow-md md:text-9xl"> {t("global.dasta")}</h1>
            <p className="text-center text-lg font-medium md:text-3xl">{t("global.slogan")}</p>
          </div>
        </div>
        <div className="absolute left-0 right-0 top-0 z-10 h-full w-full bg-black/30" />
        <Image
          src="/images/web-portal/web-portal-bg.png"
          fill
          alt="DASTA"
          style={{ objectFit: "cover", filter: "grayscale(100%)" }}
        />
      </div>

      <ItemContainer>
        <div className="flex flex-col items-center gap-4 md:gap-10">
          <ItemHeader title={t("webPortal.cbtThailand.title")} description={t("webPortal.cbtThailand.description")} />
          <ItemImage alt={"CBT THAILAND"} src={"/images/web-portal/cbt-thailand.png"} />
          <div className="w-fit-content flex h-auto items-center justify-center p-4 py-2 sm:min-w-[20rem] sm:max-w-fit md:block">
            <NextLink
              href={"https://cbtthailand.dasta.or.th/"}
              intent={"primaryButton"}
              // target="_blank"
              className="flex h-auto w-full items-center justify-center p-4 py-2"
            >
              {t("webPortal.cbtThailand.button")}
            </NextLink>
          </div>
        </div>
      </ItemContainer>

      <ItemContainer textLeft isGreen>
        <div className="flex flex-col-reverse gap-4 md:flex-row-reverse">
          <div className="flex flex-col gap-4 md:flex-1 md:gap-10">
            <ItemHeader
              title={t("webPortal.carbonFootprint.title")}
              description={t("webPortal.carbonFootprint.description")}
            />
          </div>
          <ItemImage alt={"Carbon Footprint"} isFlex src={"/images/web-portal/carbon-footprint.png"} />
        </div>
      </ItemContainer>

      <ItemContainer textLeft>
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex flex-col gap-4 md:flex-1 md:gap-10">
            <ItemHeader title={t("webPortal.travelMart.title")} description={t("webPortal.travelMart.description")} />
            <NextLink
              href={"/travel-mart"}
              intent={"primaryButton"}
              className="w-fit-content hidden h-auto w-full p-4 py-2 sm:min-w-[20rem] sm:max-w-fit md:block"
            >
              {t("webPortal.travelMart.button")}
            </NextLink>
          </div>
          <ItemImage alt={"Travel Mart"} isFlex src={"/images/web-portal/travel-mart.png"} />
        </div>
      </ItemContainer>

      <ItemContainer isGreen textLeft>
        <div className="flex flex-col-reverse gap-4 md:flex-row-reverse">
          <div className="flex flex-col gap-4 md:flex-1 md:gap-10">
            <ItemHeader title={t("webPortal.photoBank.title")} description={t("webPortal.photoBank.description")} />
          </div>
          <ItemImage alt={"Photo Bank"} isFlex src={"/images/web-portal/photo-bank.png"} />
        </div>
      </ItemContainer>

      {/* <ItemContainer>
        <div className="flex flex-col gap-4 md:gap-10">
          <ItemHeader title={t("webPortal.api.title")} description={t("webPortal.api.description")} />
        </div>
      </ItemContainer> */}

      <ItemContainer textLeft>
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex flex-col gap-4 md:flex-1 md:gap-10">
            <ItemHeader title={t("webPortal.api.title")} description={t("webPortal.api.description")} />
          </div>
          <ItemImage alt={"Api Management"} isFlex src={"/images/web-portal/cbt-api.png"} />
        </div>
      </ItemContainer>

      <ItemContainer isGreen>
        <div className="flex flex-col gap-4 md:gap-10">
          <ItemHeader title={t("webPortal.saiSroi.title")} description={t("webPortal.saiSroi.description")} />
          <ItemImage alt={"SAI/SROI"} src={"/images/web-portal/sia-sroi.png"} />
        </div>
      </ItemContainer>

      <Footer className="md:relative" />
    </div>
  );
};

export default WebPortal;
