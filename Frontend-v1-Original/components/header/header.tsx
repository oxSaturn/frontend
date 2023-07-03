import { useRouter } from "next/router";
import Image from "next/image";
import { Badge, IconButton, Typography } from "@mui/material";
import { List } from "@mui/icons-material";

import Navigation from "../navigation/navigation";
import TransactionQueue, {
  useTransactionStore,
} from "../transactionQueue/transactionQueue";
import useScrollPosition from "../../hooks/useScrollPosition";

import Info from "./info";
import { ConnectButton } from "./ConnectButton";

function SiteLogo(props: { className?: string }) {
  const { className } = props;
  return (
    <Image
      className={className}
      src="/images/fvm_logo_blue.png"
      alt="fvm by velocimeter logo"
      height={357}
      width={1200}
    />
  );
}

function Header() {
  const router = useRouter();

  const scrollPosition = useScrollPosition();

  const { openQueue, transactions } = useTransactionStore();

  return (
    <>
      <div
        className={`grid w-full grid-flow-row border-primary border-opacity-50 transition-all duration-200 ${
          scrollPosition > 0
            ? "border-b-[0.25px] bg-[rgba(0,0,0,0.973)] opacity-90 backdrop-blur-2xl"
            : "border-b-0 border-none"
        }`}
      >
        <Info />
        <div className="flex min-h-[60px] items-center justify-between rounded-none border-none px-5">
          <a
            onClick={() => router.push("/home")}
            className="flex flex-shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[40px] py-5"
          >
            <SiteLogo className="h-[50px] w-auto" />
          </a>
          <Navigation />
          <div className="flex justify-end gap-1 md:max-[1200px]:w-full md:max-[1200px]:items-end md:max-[1200px]:px-8 xl:w-[260px]">
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
            <span className="md:fixed md:right-5 md:bottom-5 xl:static">
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
