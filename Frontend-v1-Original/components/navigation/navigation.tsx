import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

function Navigation() {
  const router = useRouter();
  const [active, setActive] = useState("swap");

  useEffect(() => {
    const activePath = router.asPath;
    if (activePath.includes("home")) {
      setActive("home");
    }
    if (activePath.includes("swap")) {
      setActive("swap");
    }
    if (activePath.includes("liquidity")) {
      setActive("liquidity");
    }
    if (activePath.includes("vest")) {
      setActive("vest");
    }
    if (activePath.includes("vote")) {
      setActive("vote");
    }
    if (activePath.includes("bribe")) {
      setActive("bribe");
    }
    if (activePath.includes("rewards")) {
      setActive("rewards");
    }
    if (activePath.includes("launchpad")) {
      setActive("launchpad");
    }
  }, [router.asPath]);

  const renderNavs = () => {
    return (
      <>
        {renderSubNav("Swap", "swap")}
        {renderSubNav("Liquidity", "liquidity")}
        {renderSubNav("Vest", "vest")}
        {renderSubNav("Vote", "vote")}
        {renderSubNav("Rewards", "rewards")}
        {renderSubNav("Bribe", "bribe")}
      </>
    );
  };

  const renderSubNav = (title: string, link: string) => {
    return (
      <Link
        href={"/" + link}
        className={`cursor-pointer select-none appearance-none rounded-lg px-[14px] py-2 text-sm capitalize no-underline outline-0 transition-colors lg:text-base ${
          active === link ? "bg-cyan text-black" : "hover:text-cyan"
        }`}
      >
        {title}
      </Link>
    );
  };

  return (
    <div className="grid w-full grid-cols-1 gap-y-1 md:flex md:w-auto md:items-center md:gap-x-1 md:rounded-2xl md:border-0 md:bg-transparent md:p-2 md:text-center">
      {renderNavs()}
    </div>
  );
}

export default Navigation;
