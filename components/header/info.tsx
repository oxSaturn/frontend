import { useState, useEffect, type ReactNode } from "react";

import { CONTRACTS } from "../../stores/constants/constants";
import { formatFinancialData } from "../../utils/utils";

import { GOV_TOKEN_SYMBOL } from "../../stores/constants/contracts";

import {
  useActivePeriod,
  useCirculatingSupply,
  useMarketCap,
  useTbv,
  useTokenPrices,
  useTvl,
} from "./lib/queries";

interface InfoItem {
  label: string;
  value: string | ReactNode;
}

export default function Info() {
  const { data: tokenPrices } = useTokenPrices();
  const { data: updateDate } = useActivePeriod();
  const { data: tvl } = useTvl();
  const { data: tbv } = useTbv();
  const { data: circulatingSupply } = useCirculatingSupply();
  const { data: mCap } = useMarketCap();

  const infoItems: InfoItem[] = [
    {
      label: "TVL",
      value: `$${formatFinancialData(tvl ?? 0)}`,
    },
    {
      label: "Total Bribe Value",
      value: `$${formatFinancialData(tbv ?? 0)}`,
    },
    {
      label: GOV_TOKEN_SYMBOL + " Price",
      value: `$${(
        tokenPrices?.get(CONTRACTS.GOV_TOKEN_ADDRESS.toLowerCase()) ?? 0
      ).toFixed(3)}`,
    },
    {
      label: "Market Cap",
      value: `$${formatFinancialData(mCap ?? 0)}`,
    },
    {
      label: "Circulating Supply",
      value: formatFinancialData(circulatingSupply ?? 0),
    },
    {
      label: "Next Epoch",
      value: <Timer deadline={updateDate} />,
    },
  ];

  return (
    <div className="grid gap-1 px-[14px] font-sono text-sm md:flex md:flex-row md:items-stretch md:py-3 lg:gap-x-5">
      {infoItems.map((item) => (
        <div
          key={item.label}
          className="flex w-full items-center justify-between space-x-3 md:grid md:grid-cols-1 md:grid-rows-2 md:items-start md:space-x-0 lg:flex lg:w-auto lg:items-center lg:justify-start lg:gap-x-1"
        >
          <span className="font-normal text-gray-500">{item.label}</span>
          <span className="tracking-tighter">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

const SECOND = 1_000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

function Timer({ deadline }: { deadline: number | undefined }) {
  const { days, hours, minutes, seconds } = useTimer(deadline, SECOND);

  return (
    <>
      {days + hours + minutes + seconds <= 0
        ? "0d_0h_0m"
        : `${days}d_${hours}h_${minutes}m_${seconds}s`}
    </>
  );
}

function useTimer(deadline = 0, interval = SECOND) {
  const [timeLeft, setTimeLeft] = useState(deadline * 1000 - Date.now());

  useEffect(() => {
    setTimeLeft(deadline * 1000 - Date.now());
    const intervalId = setInterval(() => {
      setTimeLeft(deadline * 1000 - Date.now());
    }, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [deadline, interval]);

  return {
    days: Math.floor(timeLeft / DAY),
    hours: Math.floor((timeLeft / HOUR) % 24),
    minutes: Math.floor((timeLeft / MINUTE) % 60),
    seconds: Math.floor((timeLeft / SECOND) % 60),
  };
}
