import { useAccount } from "wagmi";

import { TransferNFT } from "../../../components/ssVest/TransferNFT";
export default function Transfer() {
  const { address } = useAccount();

  return (
    <div className="relative mt-0 flex h-full w-full flex-col pt-8">
      {address ? <TransferNFT /> : null}
    </div>
  );
}
