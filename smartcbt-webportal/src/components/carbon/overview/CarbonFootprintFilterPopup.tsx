import { Button } from "@/components/Button";
import { cn } from "@/utils/cn";
import { Dialog, Tab } from "@headlessui/react";
import th from "date-fns/locale/th";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { FilterType } from "./CarbonFootprintOverview";
registerLocale("th", th);

type CarbonFootprintFilterPopupProps = {
  isOpen: boolean;
  initialStartDate: Date;
  initialEndDate: Date;
  type: FilterType;
  onDateRangeSelected: (start: Date, end: Date, type: FilterType) => void;
  onClose: (didConfirm: boolean) => void;
};

export const CarbonFootprintFilterPopup = (props: CarbonFootprintFilterPopupProps) => {
  const t = useTranslations("common");
  const { isOpen, initialStartDate, initialEndDate, type, onDateRangeSelected, onClose } = props;

  const [startDate, setStartDate] = useState<Date | null>();
  const [endDate, setEndDate] = useState<Date | null>();
  const [startMonth, setStartMonth] = useState<Date | null>();
  const [endMonth, setEndMonth] = useState<Date | null>();
  const [selectedIndex, setSelectedIndex] = useState(type == FilterType.day ? 0 : 1);

  const maxDateValue = 13;
  const locale= "th"

  const calculateMaxDate = (startDate: Date | null | undefined, selectedIndex: number) => {
    if (!startDate) return null;
    const maxDate = new Date(startDate);
    if (selectedIndex === 0) {
      maxDate.setDate(maxDate.getDate() + maxDateValue);
    } else {
      maxDate.setMonth(maxDate.getMonth() + maxDateValue);
    }
    return maxDate;
  };

  const getMaxDate = () => {
    if (endDate) return null;
    return calculateMaxDate(startDate, selectedIndex);
  };

  const getMaxMonth = () => {
    if (endMonth) return null;
    return calculateMaxDate(startMonth, selectedIndex);
  };

  const renderTab = (index: number, label: string) => (
    <Tab
      key={index}
      className={cn(
        "flex w-full items-center justify-center gap-2 whitespace-nowrap p-2 text-center text-smart-cbt-dark-green",
        index === selectedIndex
          ? "border-b-4 border-smart-cbt-green bg-smart-cbt-light-green text-smart-cbt-green"
          : "text-smart-cbt-dark-grey"
      )}
    >
      {label}
    </Tab>
  );

  useEffect(() => {
    if (type == FilterType.day) {
      setStartDate(initialStartDate);
      setEndDate(initialEndDate);
    } else {
      setStartMonth(initialStartDate);
      setEndMonth(initialEndDate);
    }
  }, []);

  const handleOnClick = () => {
    if (selectedIndex == 0) {
      if (!startDate) return;
      if (!endDate) return;
      onDateRangeSelected(startDate, endDate, FilterType.day);
    } else {
      if (!startMonth) return;
      if (!endMonth) return;
      onDateRangeSelected(startMonth, endMonth, FilterType.month);
    }
  }

  const handleOnChangeDate = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  const handleOnChangeMonth = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartMonth(start);
    setEndMonth(end);
  };

  return (
    <Dialog open={isOpen} onClose={close} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto flex max-h-[95vh] w-full min-w-0 max-w-[95%] flex-col items-center gap-5 overflow-y-auto rounded-xl bg-white p-6 shadow-2xl md:max-w-[600px] md:p-8 lg:min-w-[400px]">
          <div className="flex w-full flex-col gap-4">
            <div className="flex justify-center">{t("carbon.overview.popup.filter.title")}</div>
            <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
              <Tab.List className="flex items-center justify-between overflow-x-hidden border-b border-smart-cbt-border-green">
                {renderTab(0, t("carbon.overview.popup.filter.tabs.filterByDate"))}
                {renderTab(1, t("carbon.overview.popup.filter.tabs.filterByMonth"))}
              </Tab.List>
              <Tab.Panels>
                <Tab.Panel>
                  <div className="flex justify-center p-4 md:p-12">
                    <DatePicker
                      selected={startDate}
                      onChange={handleOnChangeDate}
                      startDate={startDate}
                      endDate={endDate}
                      maxDate={getMaxDate()}
                      locale={locale}
                      selectsRange
                      inline
                    />
                  </div>
                </Tab.Panel>
                <Tab.Panel>
                  <div className="flex justify-center p-4 md:p-12">
                    <DatePicker
                      selected={startMonth}
                      onChange={handleOnChangeMonth}
                      startDate={startMonth}
                      endDate={endMonth}
                      maxDate={getMaxMonth()}
                      locale={locale}
                      selectsRange
                      showMonthYearPicker
                      showFullMonthYearPicker
                      inline
                    />
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
          <div className="flex w-full flex-row justify-center gap-4 mt-2">
            <Button
              type="button"
              onClick={() => onClose(false)}
              intent="secondary"
              size="small"
              className="px-8"
            >
              {t("global.cancel")}
            </Button>
            <Button onClick={handleOnClick} intent="primary" size="small" className="px-8">
              {t("global.ok")}
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
