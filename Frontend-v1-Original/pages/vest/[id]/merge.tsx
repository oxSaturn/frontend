import { useAccount } from "wagmi";

import { MergeNFT } from "../../../components/ssVest/MergeNFT";

export default function MergeInto() {
  const { address } = useAccount();
  return (
    <div className="relative mt-0 flex h-full w-full flex-col pt-8">
      {address ? <MergeNFT /> : null}
    </div>
  );
}
