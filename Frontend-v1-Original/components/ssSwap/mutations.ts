import { getWalletClient } from "@wagmi/core";
import { canto } from "wagmi/chains";
import { formatUnits } from "viem";
import BigNumber from "bignumber.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import viemClient from "../../stores/connectors/viem";
import stores from "../../stores";
import {
  BaseAsset,
  ITransaction,
  QuoteSwapResponse,
  TransactionStatus,
} from "../../stores/types/types";
import { formatCurrency, getTXUUID } from "../../utils/utils";
import {
  ACTIONS,
  CONTRACTS,
  MAX_UINT256,
  NATIVE_TOKEN,
  QUERY_KEYS,
} from "../../stores/constants/constants";
import { writeApprove, writeWrapUnwrap } from "../../lib/global/mutations";

const getFirebirdSwapAllowance = async (
  token: BaseAsset,
  address: `0x${string}`,
  quote: QuoteSwapResponse
) => {
  const allowance = await viemClient.readContract({
    address: token.address,
    abi: CONTRACTS.ERC20_ABI,
    functionName: "allowance",
    args: [address, quote.encodedData.router],
  });

  return formatUnits(allowance, token.decimals);
};

const swap = async (options: {
  quote: QuoteSwapResponse | null;
  fromAsset: BaseAsset | null;
  toAsset: BaseAsset | null;
}) => {
  const walletClient = await getWalletClient({ chainId: canto.id });
  if (!walletClient) {
    console.warn("wallet");
    throw new Error("Wallet not connected");
  }
  if (!options.quote || !options.fromAsset || !options.toAsset) {
    throw new Error("Invalid swap options");
  }

  const [account] = await walletClient.getAddresses();

  const { quote, fromAsset, toAsset } = options;

  const fromAmount = BigNumber(quote.maxReturn.totalFrom)
    .div(10 ** fromAsset.decimals)
    .toFixed(fromAsset.decimals);

  // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
  let allowanceTXID = getTXUUID();
  let swapTXID = getTXUUID();

  stores.emitter.emit(ACTIONS.TX_ADDED, {
    title: `Swap ${fromAsset.symbol} for ${toAsset.symbol}`,
    type: "Swap",
    verb: "Swap Successful",
    transactions: [
      {
        uuid: allowanceTXID,
        description: `Checking your ${fromAsset.symbol} allowance`,
        status: "WAITING",
      },
      {
        uuid: swapTXID,
        description: `Swap ${formatCurrency(fromAmount)} ${
          fromAsset.symbol
        } for ${toAsset.symbol}`,
        status: "WAITING",
      },
    ],
  });

  let allowance: string | null = "0";

  // CHECK ALLOWANCES AND SET TX DISPLAY
  if (fromAsset.address !== NATIVE_TOKEN.symbol) {
    allowance = await getFirebirdSwapAllowance(fromAsset, account, quote);
    if (BigNumber(allowance).lt(fromAmount)) {
      stores.emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowanceTXID,
        description: `Allow the router to spend your ${fromAsset.symbol}`,
      });
    } else {
      stores.emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowanceTXID,
        description: `Allowance on ${fromAsset.symbol} sufficient`,
        status: "DONE",
      });
    }
  } else {
    allowance = MAX_UINT256;
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: allowanceTXID,
      description: `Allowance on ${fromAsset.symbol} sufficient`,
      status: "DONE",
    });
  }

  if (!allowance) throw new Error("Couldn't fetch allowance");
  // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
  if (BigNumber(allowance).lt(fromAmount)) {
    await writeApprove(
      walletClient,
      allowanceTXID,
      fromAsset.address,
      quote.encodedData.router
    );
  }

  // SUBMIT SWAP TRANSACTION
  if (quote.maxReturn.from === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
    try {
      stores.emitter.emit(ACTIONS.TX_PENDING, { uuid: swapTXID });
      const txHash = await walletClient.sendTransaction({
        account,
        to: quote.encodedData.router,
        value: BigInt(quote.maxReturn.totalFrom),
        data: quote.encodedData.data,
        gasPrice: BigInt(quote.maxReturn.gasPrice),
        chain: canto,
      });
      const receipt = await viemClient.waitForTransactionReceipt({
        hash: txHash,
      });
      if (receipt.status === "success") {
        stores.emitter.emit(ACTIONS.TX_CONFIRMED, {
          uuid: swapTXID,
          txHash: receipt.transactionHash,
        });
      }
    } catch (error) {
      if (!(error as Error).toString().includes("-32601")) {
        if ((error as Error).message) {
          stores.emitter.emit(ACTIONS.TX_REJECTED, {
            uuid: swapTXID,
            error: (error as Error).message,
          });
        }
        stores.emitter.emit(ACTIONS.TX_REJECTED, {
          uuid: swapTXID,
          error: error,
        });
      }
    }
  } else {
    try {
      stores.emitter.emit(ACTIONS.TX_PENDING, { uuid: swapTXID });
      const txHash = await walletClient.sendTransaction({
        account,
        to: quote.encodedData.router,
        value: undefined,
        data: quote.encodedData.data,
        gasPrice: BigInt(quote.maxReturn.gasPrice),
        chain: canto,
      });
      const receipt = await viemClient.waitForTransactionReceipt({
        hash: txHash,
      });
      if (receipt.status === "success") {
        stores.emitter.emit(ACTIONS.TX_CONFIRMED, {
          uuid: swapTXID,
          txHash: receipt.transactionHash,
        });
      }
    } catch (error) {
      if (!(error as Error).toString().includes("-32601")) {
        if ((error as Error).message) {
          stores.emitter.emit(ACTIONS.TX_REJECTED, {
            uuid: swapTXID,
            error: (error as Error).message,
          });
        }
        stores.emitter.emit(ACTIONS.TX_REJECTED, {
          uuid: swapTXID,
          error: error,
        });
      }
    }
  }
};

export const useSwap = (onSuccess: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (options: {
      quote: QuoteSwapResponse | null;
      fromAsset: BaseAsset | null;
      toAsset: BaseAsset | null;
    }) => swap(options),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO_NO_NATIVE]);
      queryClient.invalidateQueries([QUERY_KEYS.PAIRS_WITH_GAUGES]);
      onSuccess();
    },
  });
};

const wrapOrUnwrap = async (options: {
  fromAsset: BaseAsset | null;
  toAsset: BaseAsset | null;
  fromAmount: string;
}) => {
  const walletClient = await getWalletClient({ chainId: canto.id });
  if (!walletClient) {
    throw new Error("wallet");
  }
  if (!options.fromAsset || !options.toAsset) {
    throw new Error("assets");
  }

  const {
    fromAsset: { address: fromAddress, symbol: fromSymbol },
    toAsset: { address: toAddress, symbol: toSymbol },
    fromAmount,
  } = options;
  const isWrap = fromSymbol === "CANTO";
  const action = isWrap ? "Wrap" : "Unwrap";

  // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
  const wrapUnwrapTXID = getTXUUID();
  const tx: ITransaction = {
    title: `${action} ${fromSymbol} for ${toSymbol}`,
    type: action,
    verb: `${action} Successful`,
    transactions: [
      {
        uuid: wrapUnwrapTXID,
        description: `${action} ${formatCurrency(
          fromAmount
        )} ${fromSymbol} for ${toSymbol}`,
        status: TransactionStatus.WAITING,
      },
    ],
  };

  stores.emitter.emit(ACTIONS.TX_ADDED, tx);

  // SUBMIT WRAP_UNWRAP TRANSACTION
  const sendFromAmount = BigNumber(fromAmount)
    .times(10 ** 18)
    .toFixed(0);

  await writeWrapUnwrap(
    walletClient,
    isWrap ? toAddress : fromAddress,
    isWrap,
    wrapUnwrapTXID,
    sendFromAmount
  );
};

export const useWrapOrUnwrap = (onSuccess: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (options: {
      fromAsset: BaseAsset | null;
      toAsset: BaseAsset | null;
      fromAmount: string;
    }) => wrapOrUnwrap(options),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO_NO_NATIVE]);
      queryClient.invalidateQueries([QUERY_KEYS.PAIRS_WITH_GAUGES]);
      onSuccess();
    },
  });
};
