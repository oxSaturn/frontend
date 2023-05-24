import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getWalletClient, getAccount } from "@wagmi/core";
import { canto } from "wagmi/chains";

import viemClient from "../../stores/connectors/viem";

import stores from "../../stores";
import {
  ACTIONS,
  CONTRACTS,
  QUERY_KEYS,
} from "../../stores/constants/constants";
import { getTXUUID } from "../../utils/utils";
import { writeContractWrapper } from "../../lib/global/mutations";

const bribeAutoBribe = async (autoBribeAddress: `0x${string}`) => {
  const { address: account } = getAccount();
  if (!account) {
    console.warn("account not found");
    return null;
  }

  const walletClient = await getWalletClient({ chainId: canto.id });
  if (!walletClient) {
    console.warn("wallet");
    return null;
  }

  // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
  let bribeTXID = getTXUUID();

  await stores.emitter.emit(ACTIONS.TX_ADDED, {
    title: `Bribe AutoBribe`,
    verb: "Bribed",
    transactions: [
      {
        uuid: bribeTXID,
        description: `Bribing AutoBribe`,
        status: "WAITING",
      },
    ],
  });

  const writeBribeAutoBribe = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      address: autoBribeAddress,
      abi: CONTRACTS.AUTO_BRIBE_ABI,
      functionName: "bribe",
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };
  await writeContractWrapper(bribeTXID, writeBribeAutoBribe);
};

export const useBribeAutoBribe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bribeAutoBribe,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.AUTO_BRIBES]);
    },
  });
};
