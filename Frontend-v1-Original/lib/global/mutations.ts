import { type WalletClient } from "wagmi";
import { BaseError, type WriteContractReturnType } from "viem";

import viemClient from "../../stores/connectors/viem";

import {
  ACTIONS,
  CONTRACTS,
  MAX_UINT256,
  W_NATIVE_ABI,
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

export const writeWrapUnwrap = async (
  walletClient: WalletClient,
  targetWrapper: `0x${string}`,
  isWrap: boolean,
  wrapUnwrapTXID: string,
  sendFromAmount: string
) => {
  const [account] = await walletClient.getAddresses();
  const wNativeTokenContract = {
    address: targetWrapper,
    abi: W_NATIVE_ABI,
  } as const;
  const writeWrap = async () => {
    const { request } = await viemClient.simulateContract({
      ...wNativeTokenContract,
      account,
      functionName: "deposit",
      args: undefined,
      value: BigInt(sendFromAmount),
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };
  const writeUnwrap = async () => {
    const { request } = await viemClient.simulateContract({
      ...wNativeTokenContract,
      account,
      functionName: "withdraw",
      args: [BigInt(sendFromAmount)],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };
  if (isWrap) {
    await writeContractWrapper(wrapUnwrapTXID, writeWrap);
  } else {
    await writeContractWrapper(wrapUnwrapTXID, writeUnwrap);
  }
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
