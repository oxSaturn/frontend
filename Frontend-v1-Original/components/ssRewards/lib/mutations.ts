import { type WalletClient } from "viem";

import viemClient from "../../../stores/connectors/viem";
import { CONTRACTS } from "../../../stores/constants/constants";
import { writeContractWrapper } from "../../../lib/global/mutations";

export const writeClaimBribes = async (
  walletClient: WalletClient,
  txId: string,
  sendGauges: `0x${string}`[],
  sendTokens: `0x${string}`[][],
  tokenID: string
) => {
  const [account] = await walletClient.getAddresses();
  const write = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      address: CONTRACTS.VOTER_ADDRESS,
      abi: CONTRACTS.VOTER_ABI,
      functionName: "claimBribes",
      args: [sendGauges, sendTokens, BigInt(tokenID)],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };
  await writeContractWrapper(txId, write);
};
