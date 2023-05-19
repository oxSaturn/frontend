import { type WalletClient } from "wagmi";
import { BaseError, type WriteContractReturnType } from "viem";

import viemClient from "../../stores/connectors/viem";

import {
  ACTIONS,
  CONTRACTS,
  MAX_UINT256,
} from "../../stores/constants/constants";
import stores from "../../stores";

export const writeApprove = async (
  walletClient: WalletClient,
  txId: string,
  tokenAddress: `0x${string}`,
  approveTo: `0x${string}`
) => {
  const [account] = await walletClient.getAddresses();
  const write = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      address: tokenAddress,
      abi: CONTRACTS.ERC20_ABI,
      functionName: "approve",
      args: [approveTo, BigInt(MAX_UINT256)],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };
  await writeContractWrapper(txId, write);
};

const writeContractWrapper = async (
  txId: string,
  write: () => Promise<WriteContractReturnType>
) => {
  try {
    stores.emitter.emit(ACTIONS.TX_PENDING, { uuid: txId });

    const txHash = await write();

    const receipt = await viemClient.waitForTransactionReceipt({
      hash: txHash,
    });
    if (receipt.status === "success") {
      stores.emitter.emit(ACTIONS.TX_CONFIRMED, {
        uuid: txId,
        txHash: receipt.transactionHash,
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      stores.emitter.emit(ACTIONS.TX_REJECTED, {
        uuid: txId,
        error: error.message,
      });
      return;
    }
    if (error instanceof BaseError) {
      stores.emitter.emit(ACTIONS.TX_REJECTED, {
        uuid: txId,
        error: error.details,
      });
      return;
    }
    stores.emitter.emit(ACTIONS.TX_REJECTED, {
      uuid: txId,
      error: error,
    });
  }
};
