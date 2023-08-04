import { useAccount, useNetwork, useSwitchNetwork } from "wagmi";
import { Typography, Button } from "@mui/material";

import { chainToConnect } from "../../stores/constants/constants";

interface Props {
  children: React.ReactNode;
  placeholder: React.ReactNode;
}

export function PageWrapper(props: Props) {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork({ chainId: chainToConnect.id });
  return (
    <div className="flex h-full w-full flex-shrink-0 flex-grow flex-col">
      {address ? (
        chain?.unsupported ? (
          <div className="flex flex-grow items-center justify-center text-center">
            <div className="space-y-2">
              <Typography className="max-w-md text-2xl text-white">
                {`The chain you're connected to isn't supported. Please
                check that your wallet is connected to ${chainToConnect.name} Mainnet.`}
              </Typography>
              <Button
                className="scale-90 rounded-3xl border border-solid border-green-300 bg-green-300 px-6 pt-3 pb-4 font-bold transition-all duration-300 hover:scale-95 hover:bg-emerald-300"
                variant="contained"
                onClick={() => switchNetwork?.()}
              >
                Switch to {chainToConnect.name}
              </Button>
            </div>
          </div>
        ) : (
          <div>{props.children}</div>
        )
      ) : (
        <div className="flex h-full w-full flex-grow flex-col items-center justify-center px-10 text-center shadow-none md:bg-transparent lg:w-full">
          {props.placeholder}
        </div>
      )}
    </div>
  );
}
