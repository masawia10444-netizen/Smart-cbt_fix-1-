"use client";

import { AppContext, TravelMartContext } from "@/contexts/App.context";
import { TravelMartProjectSearchSchema } from "@/schemas/forms/travel-mart/travel-mart-project-search-schema";
import * as _ from "lodash";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Fragment, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../Button";
import CarouselNext from "../Carousel";
import Footer from "../Footer";
import NavigationBar from "../NavigationBar";
import { useSession } from "../context-provider/AuthProvider";
import FormDropdown from "../form/FormDropdown";
import FormSimpleSearchInput from "../form/FormSimpleSearchInput";
import MainMenuGridItem from "../main-menu/MainMenuGridItem";
type TravelMartMenus = {
  title: string;
  image: string;
  href: string;
  disabled?: boolean;
};

type TravelMartMainProps = {
  profile?: any;
};

export const travelMartCommunityMenus = [
  {
    title: "travelMart.main.menus.businessIntroduction",
    image: "/images/travel-mart/menus/business-introduction.png",
    href: "/travel-mart/recommend/entrepreneur",
    disabled: false,
  },
  {
    title: "travelMart.main.menus.communityInformation",
    image: "/images/travel-mart/menus/community-information.png",
    href: "/travel-mart/community-infos",
    disabled: false,
  },
  {
    title: "travelMart.main.menus.businessNegotiations",
    image: "/images/travel-mart/menus/business-negotiations.png",
    href: "/travel-mart/business-negotiation/community",
    disabled: false,
  },
];

export const travelMartEntrepreneurMenus = [
  {
    title: "travelMart.main.menus.communityIntroduction",
    image: "/images/travel-mart/menus/community-introduction.png",
    href: "/travel-mart/communities",
    disabled: false,
  },
  {
    title: "travelMart.main.menus.businessNegotiations",
    image: "/images/travel-mart/menus/business-negotiations.png",
    href: "/travel-mart/business-negotiation/entrepreneur",
    disabled: false,
  },
];

export const travelMartGuideMenus = [
  // {
  //   title: "travelMart.main.menus.businessIntroduction",
  //   image: "/images/travel-mart/menus/business-introduction.png",
  //   href: "/travel-mart/recommend/entrepreneur",
  //   disabled: false,
  // },
  // {
  //   title: "travelMart.main.menus.communityInformation",
  //   image: "/images/travel-mart/menus/community-information.png",
  //   href: "/travel-mart/communities-info",
  //   disabled: false,
  // },
];

export const travelMartMainMenus = [
  {
    title: "travelMart.main.menus.event",
    image: "/images/travel-mart/menus/event.png",
    href: "/travel-mart/schedule-events/dasta-level-up-pitching-2566",
  },
  {
    title: "travelMart.main.menus.documents",
    image: "/images/travel-mart/menus/documents.png",
    href: "/travel-mart/manual",
  },
  {
    title: "travelMart.main.menus.training",
    image: "/images/travel-mart/menus/training.png",
    href: "/travel-mart/training",
  },
  {
    title: "travelMart.main.menus.sell",
    image: "/images/travel-mart/menus/sell.png",
    href: "/travel-mart/main-pitching/project-list",
  },
];

const TravelMartMain = ({ profile }: TravelMartMainProps) => {
  const t = useTranslations("common");
  const router = useRouter();

  const [isMobileOpened, setIsMobileOpened] = useState(false);
  const [roleTravelMartMenu, setRoleTravelMartMenu] = useState<string>();
  const [travelMartMenus, setTravelMartMenus] = useState<TravelMartMenus[]>(travelMartMainMenus);

  const { provinces } = useContext(AppContext);
  const { attractionTypes, regions } = useContext(TravelMartContext);

  const { control, handleSubmit, watch } = useForm<TravelMartProjectSearchSchema>();

  const regionId = watch("regions");

  const slideImages = [
    "/images/travel-mart/travel-mart-bg.png",
    "/images/travel-mart/travel-mart-bg.png",
    "/images/travel-mart/travel-mart-bg.png",
    "/images/travel-mart/travel-mart-bg.png",
    "/images/travel-mart/travel-mart-bg.png",
  ];

  const { session } = useSession();

  const toggleMobileMenu = () => {
    setIsMobileOpened((opened) => !opened);
  };

  useEffect(() => {
    const roles = profile.roles;
    let communityRole: any = null;
    let organizationyRole: any = null;
    let guideRole: any = null;

    roles.forEach((role: any) => {
      if (role.app_code == "BUSINESS" && role.status == "published") {
        if (role.role == "community") {
          communityRole = role;
        } else if (role.role == "organization") {
          organizationyRole = role;
        } else if (role.role == "guide") {
          guideRole = role;
        }
      }
    });

    if (roleTravelMartMenu == "community" && !_.isNull(communityRole)) {
      const menus = [...travelMartMainMenus, ...travelMartCommunityMenus];
      setTravelMartMenus(menus);
    } else if (roleTravelMartMenu == "organization" && !_.isNull(organizationyRole)) {
      const menus = [...travelMartMainMenus, ...travelMartEntrepreneurMenus];
      setTravelMartMenus(menus);
    } else if (roleTravelMartMenu == "guide" && !_.isNull(guideRole)) {
      const menus = [...travelMartMainMenus, ...travelMartGuideMenus];
      setTravelMartMenus(menus);
    } else {
      setTravelMartMenus(travelMartMainMenus);
    }
  }, [roleTravelMartMenu]);

  const onSubmit = handleSubmit(async (data: TravelMartProjectSearchSchema) => {
    const queryParams = [];
    if (data.q) {
      queryParams.push(`q=${data.q}`);
    }

    if (data.regions) {
      queryParams.push(`region=${data.regions.id}`);
    }

    if (data.province) {
      queryParams.push(`province=${data.province.id}`);
    }

    if (data.typeEvent) {
      queryParams.push(`typeEvent=${data.typeEvent.title}`);
    }
    const queryString = queryParams.join("&");
    const url = `/travel-mart/communities${queryString ? `?${queryString}` : ""}`;
    router.push(url);
  });

  return (
    <Fragment>
      <NavigationBar
        onToggle={toggleMobileMenu}
        setRoleTravelMartMenu={setRoleTravelMartMenu}
        isMobileOpened={isMobileOpened}
      />
      <div className="relative flex-grow">
        <div className="h-full bg-white">
          <div>
            <div className="relative h-[500px] w-full lg:h-[65vh]">
              <div className="absolute left-5 right-5 top-1/2 z-20 -translate-y-1/2 text-white md:container md:left-1/2 md:mx-auto md:-translate-x-1/2">
                <div className="flex flex-col items-center gap-4 text-white md:gap-6 lg:gap-10">
                  <h1 className="text-4xl font-semibold drop-shadow-md lg:text-7xl"> {t("travelMart.main.title")}</h1>
                  <form onSubmit={onSubmit} className="w-full">
                    <div className="flex w-full flex-col items-stretch justify-center gap-4 lg:pt-10">
                      {/* Row 1: Search Name */}
                      <div className="w-full">
                        <FormSimpleSearchInput
                          control={control}
                          name="q"
                          placeholder={t("travelMart.main.searchCommunity")}
                          showClearButton
                        />
                      </div>
                      {/* Row 2: Filters */}
                      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormDropdown
                          className="w-full"
                          buttonClassName="w-full"
                          control={control}
                          name="regions"
                          values={regions}
                          filterKey={"title"}
                          idKey={"id"}
                          displayKey={"title"}
                          title={t("travelMart.main.region")}
                          disabled={false}
                          fixed={false}
                          placeholder={t("travelMart.main.region")}
                          nullDisplay={"-"}
                        />
                        <FormDropdown
                          className="w-full"
                          buttonClassName="w-full"
                          control={control}
                          name="province"
                          values={
                            _.isNil(provinces)
                              ? []
                              : regionId
                              ? provinces.filter((p) => p.region == regionId.id)
                              : provinces
                          }
                          filterKey={"title"}
                          idKey={"id"}
                          displayKey={"title"}
                          title={t("travelMart.main.province")}
                          disabled={false}
                          fixed={false}
                          placeholder={t("travelMart.main.province")}
                          nullDisplay={"-"}
                        />
                        <FormDropdown
                          className="w-full"
                          buttonClassName="w-full"
                          control={control}
                          name="typeEvent"
                          values={attractionTypes}
                          filterKey={"title"}
                          idKey={"id"}
                          displayKey={"title"}
                          disabled={false}
                          title={t("travelMart.main.eventType")}
                          placeholder={t("travelMart.main.eventType")}
                          nullDisplay={"-"}
                          fixed={false}
                        />
                      </div>
                      {/* Row 3: Search Button */}
                      <div className="flex w-full justify-center mt-2">
                        <Button
                          intent={"primary"}
                          type="submit"
                          className="h-[48px] w-full max-w-[240px] rounded-full"
                        >
                          {t("global.search")}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
              <CarouselNext autoplay image={slideImages} />
            </div>
            <div className="py-10 md:container md:mx-auto">
              <div className="flex flex-row flex-wrap items-center justify-center gap-6">
                {travelMartMenus?.map((tm) => {
                  return (
                    <MainMenuGridItem
                      className="text-smart-cbt-dark-green"
                      key={tm.title}
                      title={tm.title}
                      href={tm.href}
                      image={tm.image}
                      disabled={tm.disabled}
                    />
                  );
                })}
              </div>
            </div>
            <Footer className={"md:relative"} />
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default TravelMartMain;
