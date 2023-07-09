import { useState, useEffect } from "react";

const SECOND = 1e3;
const MINUTE = 60 * SECOND;
const FIVE_MINUTES = 5 * MINUTE;

export function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, FIVE_MINUTES);
    return () => clearInterval(interval);
  }, []);
  return now;
}
