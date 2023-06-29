import { useState } from "react";
import {
  useAccount,
  useSwitchNetwork,
  useNetwork,
  useWaitForTransaction,
} from "wagmi";
import { fantom } from "wagmi/chains";
import { formatEther } from "viem";
import { useConnectModal } from "@rainbow-me/rainbowkit";

import * as Toast from "@radix-ui/react-toast";

import { formatCurrency } from "../../utils/utils";
import {
  useAirdropClaimClaim,
  useAirdropClaimClaimable,
  useAirdropClaimUserClaimed,
  usePrepareAirdropClaimClaim,
} from "../../lib/wagmiGen";

export function Claim() {
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastHash, setToastHash] = useState("");

  const { openConnectModal } = useConnectModal();

  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork({
    chainId: fantom.id,
  });

  const { address } = useAccount();

  const {
    data: claimable,
    isFetching: isLoadingClaimable,
    refetch: refetchClaimable,
  } = useAirdropClaimClaimable({
    chainId: fantom.id,
    args: [address!],
    enabled: !!address,
    select: (claimable) => formatEther(claimable),
  });

  const { data: claimed, refetch: refetchClaimed } = useAirdropClaimUserClaimed(
    {
      chainId: fantom.id,
      args: [address!],
      enabled: !!address,
    }
  );

  const { config, isFetching: isPreparingClaim } = usePrepareAirdropClaimClaim({
    chainId: fantom.id,
    enabled: !!claimable && parseFloat(claimable) > 0,
  });

  const {
    write: claim,
    data: txHash,
    isLoading: isWritingClaim,
  } = useAirdropClaimClaim({
    ...config,
    onSuccess(data) {
      setToastMessage("Transaction submitted!");
      setToastOpen(true);
      setToastHash(data.hash);
    },
  });

  const { isFetching: isWaitingClaim } = useWaitForTransaction({
    chainId: fantom.id,
    hash: txHash?.hash,
    onSuccess(data) {
      setToastMessage("Transaction confirmed!");
      setToastOpen(true);
      setToastHash(data.transactionHash);
      refetchClaimable();
      refetchClaimed();
    },
  });

  const isLoading =
    isLoadingClaimable || isPreparingClaim || isWritingClaim || isWaitingClaim;
  return (
    <div className="flex flex-col">
      <div className="mt-20 flex w-96 min-w-[384px] flex-col border border-primary p-5 font-sono text-lime-50 md:w-[512px] md:min-w-[512px]">
        <div className="flex items-center justify-between">
          <div>Claimable amount</div>
          <div>{formatCurrency(claimable ?? "0")} veFVM</div>
        </div>
        {claimable && parseFloat(claimable) > 0 && (
          <div className="mt-1 font-medium text-success">
            You are eligible to claim!
          </div>
        )}
        {claimable && parseFloat(claimable) === 0 && claimed === false && (
          <div className="mt-1 font-medium text-warning">
            You are NOT eligible to claim!
          </div>
        )}
        {claimed && (
          <div className="mt-1 font-medium text-success">You claimed!</div>
        )}
        <div className="my-5 flex flex-col gap-3">
          {address ? (
            chain?.unsupported ? (
              <button
                className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-primary p-5 text-center font-medium text-black transition-colors hover:bg-secondary focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
                onClick={() => switchNetwork?.()}
              >
                Switch to fantom
              </button>
            ) : (
              <button
                disabled={
                  isLoading ||
                  !claim ||
                  claimed ||
                  (!!claimable && parseFloat(claimable) === 0)
                }
                onClick={() => claim?.()}
                className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-primary p-5 text-center font-medium text-black transition-colors hover:bg-secondary focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
              >
                {false ? "Loading..." : "Claim"}
              </button>
            )
          ) : (
            <button
              className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-primary p-5 text-center font-medium text-black transition-colors hover:bg-secondary focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
              onClick={() => openConnectModal?.()}
            >
              Connect wallet
            </button>
          )}
        </div>
      </div>
      <Toast.Root
        className="prose radix-state-closed:animate-hide radix-state-open:animate-slideIn radix-swipe-end:animate-swipeOut rounded-md bg-[#111] p-4 text-left shadow shadow-secondary radix-swipe-cancel:translate-x-0 radix-swipe-cancel:transition-[transform_200ms_ease-out] radix-swipe-move:translate-x-[var(--radix-toast-swipe-move-x)]"
        open={toastOpen}
        onOpenChange={setToastOpen}
      >
        <Toast.Title asChild>
          <h2 className="text-success">Success!</h2>
        </Toast.Title>
        <Toast.Description asChild>
          <p className="text-primary">{toastMessage}</p>
        </Toast.Description>
        <Toast.Action
          className="[grid-area:_action]"
          asChild
          altText="Look on ftmscan"
        >
          <a
            href={`https://ftmscan.com/tx/${toastHash}`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm text-secondary underline transition-colors hover:text-primary hover:no-underline"
          >
            Look on ftmscan
          </a>
        </Toast.Action>
      </Toast.Root>
      <Toast.Viewport className="fixed bottom-0 right-0 z-[2147483647] m-0 flex w-[390px] max-w-[100vw] list-none flex-col gap-3 p-6 outline-none" />
    </div>
  );
}
