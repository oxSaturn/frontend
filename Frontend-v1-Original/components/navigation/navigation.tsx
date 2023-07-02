import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { Menu, MenuItem } from "@mui/material/";
import { OpenInNew } from "@mui/icons-material";

function Navigation() {
  const router = useRouter();
  const [active, setActive] = useState("swap");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleDocsClick = () => {
    window.open("https://docs.velocimeter.xyz/FVMtokenomics", "_blank");
    handleClose();
  };
  const handleScantoClick = () => {
    window.open("https://www.scanto.io/", "_blank");
    handleClose();
  };
  const handleGeckoClick = () => {
    window.open("https://www.geckoterminal.com/fantom/fvm/pools", "_blank");
    handleClose();
  };

  useEffect(() => {
    const activePath = router.asPath;
    if (activePath.includes("claim")) {
      setActive("claim");
    }
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
    if (activePath.includes("options")) {
      setActive("options");
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
        {renderSubNav("Options", "options")}
        {renderSubNav("Bribe", "bribe")}
        {renderSubNav("Claim", "claim")}
        {renderMoreTab()}
      </>
    );
  };
  const renderSubNav = (title: string, link: string) => {
    return (
      <Link
        href={"/" + link}
        className={`cursor-pointer select-none appearance-none rounded-lg px-[14px] py-2 text-sm capitalize no-underline outline-0 transition-colors lg:text-base ${
          active === link
            ? "bg-cyan text-black"
            : "hover:bg-[hsla(0,0%,100%,.04)]"
        }`}
      >
        {title}
      </Link>
    );
  };

  const renderMoreTab = () => {
    // TODO reckon we should probably move those links to a footer section
    return (
      <>
        <button
          id="basic-button"
          aria-controls={open ? "basic-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
          className="relative m-0 inline-flex cursor-pointer select-none appearance-none items-center justify-start rounded-lg border border-transparent bg-transparent px-[14px] pt-2 pb-[10px] text-sm capitalize text-white no-underline outline-0 hover:bg-[hsla(0,0%,100%,.04)] lg:text-base"
        >
          More
        </button>
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            "aria-labelledby": "basic-button",
          }}
          sx={{
            "& .MuiMenu-list": {
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "0.5rem",
              padding: "0.25rem",
            },
          }}
        >
          {[
            {
              onClickHandler: handleScantoClick,
              children: (
                <>
                  <Image
                    src="/images/sCANTO.png"
                    width={156}
                    height={156}
                    className="h-[30px] w-[30px]"
                    alt="sCANTO Token Icon"
                  />
                  sCANTO <OpenInNew className="w-4" />
                </>
              ),
            },
            {
              onClickHandler: handleDocsClick,
              children: (
                <>
                  Docs <OpenInNew className="w-4" />
                </>
              ),
            },
            {
              onClickHandler: handleGeckoClick,
              children: (
                <>
                  Coingecko <OpenInNew className="w-4" />
                </>
              ),
            },
          ].map(
            (
              item: {
                onClickHandler: () => void;
                children: ReactNode;
              },
              index
            ) => {
              return (
                <MenuItem
                  key={index}
                  className="relative m-0 inline-flex min-h-[30px] w-full cursor-pointer select-none appearance-none items-center justify-start gap-1 rounded-lg border border-transparent bg-transparent px-[14px] text-sm no-underline outline-0 hover:bg-secondary hover:text-black"
                  onClick={item.onClickHandler}
                >
                  {item.children}
                </MenuItem>
              );
            }
          )}
        </Menu>
      </>
    );
  };

  return (
    <div className="grid w-full grid-cols-1 gap-y-1 md:flex md:w-auto md:items-center md:gap-x-1 md:rounded-2xl md:border-0 md:bg-transparent md:p-2 md:text-center">
      {renderNavs()}
    </div>
  );
}

export default Navigation;
