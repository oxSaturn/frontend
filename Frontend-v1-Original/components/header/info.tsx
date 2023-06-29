import { useState, useEffect } from "react";

import { CONTRACTS } from "../../stores/constants/constants";

import {
  useActivePeriod,
  useCirculatingSupply,
  useMarketCap,
  useTbv,
  useTokenPrices,
  useTvl,
} from "./lib/queries";

export default function Info() {
  const { data: tokenPrices } = useTokenPrices();
  const { data: updateDate } = useActivePeriod();
  const { data: tvl } = useTvl();
  const { data: tbv } = useTbv();
  const { data: circulatingSupply } = useCirculatingSupply();
  const { data: mCap } = useMarketCap();

  return (
    <div className="flex flex-col items-start gap-1 px-6 pt-2 font-sono md:flex-row md:items-center md:gap-3 md:px-4">
      <div>
        <span className="font-normal">TVL: </span>
        <span className="tracking-tighter">
          ${formatFinancialData(tvl ?? 0)}
        </span>
      </div>
      <div>
        <span className="font-normal">TBV: </span>
        <span className="tracking-tighter">
          ${formatFinancialData(tbv ?? 0)}
        </span>
      </div>
      <div>
        <span className="font-normal">$FVM price: </span>
        <span className="tracking-tighter">
          $
          {(
            tokenPrices?.get(CONTRACTS.GOV_TOKEN_ADDRESS.toLowerCase()) ?? 0
          ).toFixed(3)}
        </span>
      </div>
      <div>
        <span className="font-normal">MCap: </span>
        <span className="tracking-tighter">
          ${formatFinancialData(mCap ?? 0)}
        </span>
      </div>
      <div>
        <span className="font-normal">Circulating Supply: </span>
        <span className="tracking-tighter">
          {formatFinancialData(circulatingSupply ?? 0)}
        </span>
      </div>
      <Timer deadline={updateDate} />
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
    <div>
      <span className="font-normal">Next Epoch: </span>
      <span className="tracking-tighter">
        {days + hours + minutes + seconds <= 0
          ? "0d_0h_0m"
          : `${days}d_${hours}h_${minutes}m_${seconds}s`}
      </span>
    </div>
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

function formatFinancialData(dataNumber: number) {
  if (dataNumber < 10_000_000) {
    return dataNumber.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  } else if (dataNumber < 1_000_000_000) {
    return (dataNumber / 1_000_000).toFixed(2) + "m";
  } else {
    return (dataNumber / 1_000_000_000).toFixed(2) + "b";
  }
}
