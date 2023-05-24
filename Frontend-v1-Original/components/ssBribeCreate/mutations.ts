import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { getAccount, getWalletClient } from "@wagmi/core";
import { canto } from "wagmi/chains";
import BigNumber from "bignumber.js";

import viemClient from "../../stores/connectors/viem";
import { writeApprove, writeContractWrapper } from "../../lib/global/mutations";

import stores from "../../stores";
import { BaseAsset, Gauge } from "../../stores/types/types";
import {
  ACTIONS,
  CONTRACTS,
  QUERY_KEYS,
  ZERO_ADDRESS,
} from "../../stores/constants/constants";
import { getTXUUID } from "../../utils/utils";

export function useCreateBribe() {
  const [createLoading, setCreateLoading] = useState(false);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createBribe,
    onMutate: () => {
      setCreateLoading(true);
    },
    onSuccess: () => {
      setCreateLoading(false);
      queryClient.invalidateQueries([QUERY_KEYS.GOV_TOKEN]);
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
    },
    onError: () => {
      setCreateLoading(false);
    },
  });

  return { ...mutation, createLoading };
}

const createBribe = async (options: {
  asset: BaseAsset | null;
  amount: string;
  gauge: Gauge | null;
}) => {
  const { address: account } = getAccount();
  if (!account) {
    throw new Error("No account found");
  }

  const walletClient = await getWalletClient({ chainId: canto.id });
  if (!walletClient) {
    throw new Error("No wallet client found");
  }

  const { asset, amount, gauge } = options;

  if (!asset || !gauge) {
    throw new Error("Asset or Gauge not found");
  }

  if (gauge.gauge.xx_wrapped_bribe_address === ZERO_ADDRESS) {
    throw new Error("Bribe address not found");
  }

  // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
  let allowanceTXID = getTXUUID();
  let bribeTXID = getTXUUID();

  stores.emitter.emit(ACTIONS.TX_ADDED, {
    title: `Create bribe on ${gauge.token0.symbol}/${gauge.token1.symbol}`,
    verb: "Bribe Created",
    transactions: [
      {
        uuid: allowanceTXID,
        description: `Checking your ${asset.symbol} allowance`,
        status: "WAITING",
      },
      {
        uuid: bribeTXID,
        description: `Create bribe`,
        status: "WAITING",
      },
    ],
  });

  // CHECK ALLOWANCES AND SET TX DISPLAY
  const allowance = await getBribeAllowance(asset, gauge, account);
  if (!allowance) throw new Error("Error getting bribe allowance");
  if (BigNumber(allowance).lt(amount)) {
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: allowanceTXID,
      description: `Allow the bribe contract to spend your ${asset.symbol}`,
    });
  } else {
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: allowanceTXID,
      description: `Allowance on ${asset.symbol} sufficient`,
      status: "DONE",
    });
  }

  // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
  if (BigNumber(allowance).lt(amount)) {
    await writeApprove(
      walletClient,
      allowanceTXID,
      asset.address,
      gauge.gauge.xx_wrapped_bribe_address
    );
  }

  const sendAmount = BigNumber(amount)
    .times(10 ** asset.decimals)
    .toFixed(0);

  // SUBMIT BRIBE TRANSACTION
  // we bribe xx_wrapped_bribe_address
  const writeCreateBribe = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      address: gauge.gauge.xx_wrapped_bribe_address,
      abi: CONTRACTS.BRIBE_ABI,
      functionName: "notifyRewardAmount",
      args: [asset.address, BigInt(sendAmount)],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };
  await writeContractWrapper(bribeTXID, writeCreateBribe);
};

const getBribeAllowance = async (
  token: BaseAsset,
  pair: Gauge,
  address: `0x${string}`
) => {
  try {
    const allowance = await viemClient.readContract({
      address: token.address,
      abi: CONTRACTS.ERC20_ABI,
      functionName: "allowance",
      // We only bribe x_wrapped_bribe_address
      args: [address, pair.gauge.xx_wrapped_bribe_address],
    });

    return formatUnits(allowance, token.decimals);
  } catch (ex) {
    console.error(ex);
    return null;
  }
};
