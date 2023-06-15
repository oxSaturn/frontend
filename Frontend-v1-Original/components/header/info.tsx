import { useState, useEffect, useCallback } from "react";

import stores from "../../stores";
import { ACTIONS, CONTRACTS } from "../../stores/constants/constants";

export default function Info() {
  const [, updateState] = useState<{}>();
  const forceUpdate = useCallback(() => updateState({}), []);

  const [tvl, setTvl] = useState<number>(0);
  const [tbv, setTbv] = useState<number>(0);
  const [flowPrice, setFlowPrice] = useState<number>(0);
  const [circulatingSupply, setCirculatingSupply] = useState<number>(0);
  const [mCap, setMCap] = useState<number>(0);
  const [updateDate, setUpdateDate] = useState(0);

  useEffect(() => {
    const stableSwapUpdated = () => {
      setTvl(stores.stableSwapStore.getStore("tvl"));
      setTbv(stores.stableSwapStore.getStore("tbv"));
      setCirculatingSupply(
        stores.stableSwapStore.getStore("circulatingSupply")
      );
      setMCap(stores.stableSwapStore.getStore("marketCap"));

      const _flowPrice = stores.stableSwapStore
        .getStore("tokenPrices")
        .get(CONTRACTS.GOV_TOKEN_ADDRESS.toLowerCase());
      if (_flowPrice) {
        setFlowPrice(_flowPrice);
      }

      const _updateDate = stores.stableSwapStore.getStore("updateDate");
      if (_updateDate) {
        setUpdateDate(_updateDate);
      }

      forceUpdate();
    };

    setTvl(stores.stableSwapStore.getStore("tvl"));
    setTbv(stores.stableSwapStore.getStore("tbv"));
    const _flowPrice = stores.stableSwapStore
      .getStore("tokenPrices")
      .get(CONTRACTS.GOV_TOKEN_ADDRESS.toLowerCase());
    if (_flowPrice) {
      setFlowPrice(_flowPrice);
    }
    setCirculatingSupply(stores.stableSwapStore.getStore("circulatingSupply"));
    setMCap(stores.stableSwapStore.getStore("marketCap"));
    const _updateDate = stores.stableSwapStore.getStore("updateDate");
    if (_updateDate) {
      setUpdateDate(_updateDate);
    }

    stores.emitter.on(ACTIONS.UPDATED, stableSwapUpdated);
    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, stableSwapUpdated);
    };
  }, [forceUpdate]);

  return (
    <div className="flex flex-col items-start gap-1 px-6 pt-2 font-sono md:flex-row md:items-center md:gap-3 md:px-4">
      <div>
        <span className="font-normal">TVL: </span>
        <span className="tracking-tighter">${formatFinancialData(tvl)}</span>
      </div>
      <div>
        <span className="font-normal">TBV: </span>
        <span className="tracking-tighter">${formatFinancialData(tbv)}</span>
      </div>
      <div>
        <span className="font-normal">$FLOW price: </span>
        <span className="tracking-tighter">${flowPrice.toFixed(3)}</span>
      </div>
      <div>
        <span className="font-normal">MCap: </span>
        <span className="tracking-tighter">${formatFinancialData(mCap)}</span>
      </div>
      <div>
        <span className="font-normal">Circulating Supply: </span>
        <span className="tracking-tighter">
          {formatFinancialData(circulatingSupply)}
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

function Timer({ deadline }: { deadline: number }) {
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

function useTimer(deadline: number, interval = SECOND) {
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
