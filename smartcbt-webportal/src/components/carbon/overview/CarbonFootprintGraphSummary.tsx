import Image from "@/components/image";
import { FootprintDashboardCalculationResultWithKeys } from "@/utils/carbon-project-form-helper";
import { chartGraphSummaryData } from "@/utils/carbon-project-helper";
import { ShadowPlugin } from "@/utils/graph-helper";
import { ArcElement, Chart as ChartJS, RadialLinearScale, Title } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useTranslations } from "next-intl";
import { StaticImageData } from "next/image";
import AccommodationIcon from "public/images/carbon-footprint/accommodation-icon.png";
import FactoryIcon from "public/images/carbon-footprint/factory-icon.png";
import FoodIcon from "public/images/carbon-footprint/food-icon.png";
import VehicleIcon from "public/images/carbon-footprint/vehicle-icon.png";
import { PolarArea } from "react-chartjs-2";
ChartJS.register(RadialLinearScale, ArcElement, Title, ChartDataLabels);

const CarbonFootprintGraphSummary = (props: FootprintDashboardCalculationResultWithKeys) => {
  const t = useTranslations("common");
  const data = chartGraphSummaryData(props);

  const PercentLabel = ({ value }: { value: number }) => {
    return <div className="text-sm sm:text-lg font-medium">{`${Math.round(value)} %`}</div>;
  };

  const GraphLabel = ({ title, icon }: { title: string; icon: StaticImageData }) => {
    return (
      <div className="flex flex-row items-center justify-center gap-1 text-[10px] sm:text-sm font-normal">
        <Image src={icon} alt="" className="h-3 w-3 sm:h-auto sm:w-auto object-contain" /> {title}
      </div>
    );
  };

  const ValueLabel = ({ value }: { value: number }) => {
    return <div className="text-[10px] sm:text-sm font-normal">{`${Math.round(value)} kgCO2eQ`}</div>;
  };

  return (
    <div className="mx-auto flex w-full max-w-xs sm:max-w-xl flex-col items-center gap-2">
      <div className="flex w-full justify-between items-start px-">
        <div className="flex flex-col gap-1 text-center text-smart-cbt-green-2">
          <PercentLabel value={props.accommodation_cf.proportion} />
          <GraphLabel title={t("carbon.summary.type.accomodations")} icon={AccommodationIcon} />
          <ValueLabel value={props.accommodation_cf.grandTotal} />
        </div>
        <div className="flex flex-col gap-1 text-center text-smart-cbt-blue">
          <PercentLabel value={props.travel_cf.proportion} />
          <GraphLabel title={t("carbon.summary.type.transportations")} icon={VehicleIcon} />
          <ValueLabel value={props.travel_cf.grandTotal} />
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative -my-6 sm:-my-8 w-full h-[220px] sm:h-[200px] flex justify-center">
        <div className="w-full max-w-[300px] sm:max-w-[350px]">
          <PolarArea options={data.options} data={data.data} plugins={ShadowPlugin} />
        </div>
      </div>

      <div className="flex w-full justify-between items-end px-2">
        <div className="flex flex-col gap-1 text-center text-smart-cbt-orange">
          <PercentLabel value={props.food_cf.proportion} />
          <GraphLabel title={t("carbon.summary.type.foods")} icon={FoodIcon} />
          <ValueLabel value={props.food_cf.grandTotal} />
        </div>
        <div className="flex flex-col gap-1 text-center text-smart-cbt-red-3">
          <PercentLabel value={props.waste_cf.proportion} />
          <GraphLabel title={t("carbon.summary.type.wastes")} icon={FactoryIcon} />
          <ValueLabel value={props.waste_cf.grandTotal} />
        </div>
      </div>
    </div>
  );
};
export default CarbonFootprintGraphSummary;
