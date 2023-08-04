import { useRouter } from "next/router";
import Image from "next/image";
import { Badge, IconButton, Typography } from "@mui/material";
import { List } from "@mui/icons-material";

import Navigation from "../navigation/navigation";
import TransactionQueue, {
  useTransactionStore,
} from "../transactionQueue/transactionQueue";

import { GOV_TOKEN_SYMBOL } from "../../stores/constants/contracts";

import Info from "./info";
import { ConnectButton } from "./ConnectButton";

function SiteLogo(props: { className?: string }) {
  const { className } = props;
  return (
    <Image
      className={className}
      src={`/images/${GOV_TOKEN_SYMBOL.toLowerCase()}_logo_blue.png`}
      alt={`${GOV_TOKEN_SYMBOL} by velocimeter logo`}
      height={357}
      width={1200}
    />
  );
}

function Header() {
  const router = useRouter();

  const { openQueue, transactions } = useTransactionStore();

  return (
    <>
      <div className="grid w-full grid-flow-row">
        <Info />
        <div className="flex min-h-[60px] items-center justify-between rounded-none border-none px-5">
          <a
            onClick={() => router.push("/home")}
            className="flex flex-shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[40px] py-5"
          >
            <SiteLogo className="h-[50px] w-auto" />
          </a>
          <Navigation />
          <div className="flex justify-end gap-1 md:max-[1200px]:w-full md:max-[1200px]:items-end md:max-[1200px]:px-8">
            {process.env.NEXT_PUBLIC_CHAINID === "740" && (
              <div>
                <Typography className="rounded-xl border border-primary bg-[#0e110c] p-4 text-sm">
                  Testnet
                </Typography>
              </div>
            )}
            {transactions.length > 0 && (
              <IconButton
                className="flex min-h-[40px] items-center rounded-none border-none bg-[rgba(224,232,255,0.05)] px-4 text-[rgba(255,255,255,0.87)] sm:min-h-[50px]"
                color="primary"
                onClick={() => openQueue()}
              >
                <Badge
                  badgeContent={transactions.length}
                  color="secondary"
                  overlap="circular"
                  sx={{
                    "& .MuiBadge-badge": {
                      background: "#06D3D7",
                      color: "#000",
                    },
                  }}
                >
                  <List className="text-white" />
                </Badge>
              </IconButton>
            )}
            <span className="md:max-[950px]:fixed md:max-[950px]:right-5 md:max-[950px]:bottom-5 lg:flex lg:w-[168px] lg:justify-end">
              {/* the reason we set w-[168px] here is to keep its width same as logo, so we can horizontally center our menu items */}
              <ConnectButton />
            </span>
          </div>
          <TransactionQueue />
        </div>
      </div>
    </>
  );
}

export default Header;
