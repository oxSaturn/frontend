import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";

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
        {renderDocsTab()}
        {renderScantoTab()}
      </>
    );
  };

  const renderDocsTab = () => {
    return (
      <button
        className="relative m-0 inline-flex cursor-pointer select-none appearance-none items-center justify-center rounded-lg border border-transparent bg-transparent px-[14px] pt-2 pb-[10px] text-sm font-medium capitalize no-underline outline-0 hover:bg-[hsla(0,0%,100%,.04)]"
        onClick={() => window.open("https://docs.velocimeter.xyz/", "_blank")}
      >
        <div className="m-0 pl-0 text-center text-xs xs:text-base">Docs</div>
      </button>
    );
  };

  const renderScantoTab = () => {
    return (
      <button
        className="relative m-0 inline-flex cursor-pointer select-none appearance-none items-center justify-center gap-1 rounded-lg border border-transparent bg-transparent px-[14px] text-sm font-medium no-underline outline-0 hover:bg-[hsla(0,0%,100%,.04)]"
        onClick={() => window.open("https://www.scanto.io/", "_blank")}
      >
        <Image
          src="/images/sCANTO.png"
          width={40}
          height={40}
          alt="sCANTO Token Icon"
        />
        <div className="m-0 pl-0 text-center text-xs xs:text-base">sCANTO</div>
      </button>
    );
  };

  const renderSubNav = (title: string, link: string) => {
    return (
      <Link
        href={"/" + link}
        className={`cursor-pointer select-none appearance-none rounded-lg px-[14px] py-2 text-sm capitalize no-underline outline-0 transition-colors lg:text-base ${
          active === link ? "bg-cyan text-black hover:text-white" : ""
        } hover:bg-[hsla(0,0%,100%,.04)]`}
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
