import { useEffect, useState } from "react";

const SECOND = 1_000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

export function useDiscountTimer(deadline = 0) {
  const [timeLeft, setTimeLeft] = useState(deadline);

  useEffect(() => {
    setTimeLeft(deadline * 1000);
    const intervalId = setInterval(() => {
      setTimeLeft(deadline * 1000);
    }, SECOND);

    return () => {
      clearInterval(intervalId);
    };
  }, [deadline]);

  return {
    days: Math.floor(timeLeft / DAY),
    hours: Math.floor((timeLeft / HOUR) % 24),
    minutes: Math.floor((timeLeft / MINUTE) % 60),
    seconds: Math.floor((timeLeft / SECOND) % 60),
  };
}
