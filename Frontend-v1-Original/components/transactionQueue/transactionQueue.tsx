import { forwardRef } from "react";
import { create } from "zustand";
import {
  Typography,
  DialogContent,
  Dialog,
  Slide,
  IconButton,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import { OpenInNew, Close, TaskAltRounded } from "@mui/icons-material";

import { ETHERSCAN_URL } from "../../stores/constants/constants";
import { ITransaction, TransactionStatus } from "../../stores/types/types";

import Transaction from "./transaction";

interface TransactionStore {
  transactions: ITransaction["transactions"];
  open: boolean;
  purpose: string | undefined;
  action: string | undefined;
  clearTransactions: () => void;
  openQueue: () => void;
  closeQueue: () => void;
  setPurpose: (_purpose: string) => void;
  setAction: (_action: string) => void;
  updateTransactionQueue: (_updateQueue: {
    transactions: ITransaction["transactions"];
    action: string;
    purpose: string;
  }) => void;
  addTransactions: (_transaction: ITransaction["transactions"]) => void;
  updatePendingTransaction: (
    _transactionPendingParams: Pick<
      ITransaction["transactions"][number],
      "uuid"
    >
  ) => void;
  updateConfirmedTransaction: (
    _transactionConfirmedParams: Pick<
      ITransaction["transactions"][number],
      "uuid" | "txHash"
    >
  ) => void;
  updateRejectedTransaction: (
    _transactionRejectedParams: Pick<
      ITransaction["transactions"][number],
      "uuid" | "error"
    >
  ) => void;
  updateTransactionStatus: (
    _transactionStatusParams: Omit<
      ITransaction["transactions"][number],
      "error" | "txHash"
    > & {
      status?: string;
    }
  ) => void;
}

export const useTransactionStore = create<TransactionStore>()((set, get) => ({
  transactions: [],
  open: false,
  purpose: undefined,
  action: undefined,
  clearTransactions: () => {
    set(() => ({
      transactions: [],
    }));
  },
  openQueue: () => {
    set({
      open: true,
    });
  },
  closeQueue: () => {
    set({
      open: false,
    });
  },
  setAction: (action) => {
    set({
      action,
    });
  },
  setPurpose: (purpose) => {
    set({
      purpose,
    });
  },
  updateTransactionQueue: (updateParams) => {
    get().addTransactions(updateParams.transactions);
    get().setPurpose(updateParams.purpose);
    get().setAction(updateParams.action);
    get().openQueue();
  },
  addTransactions: (_transactions) => {
    set((state) => ({
      transactions: [...state.transactions, ..._transactions],
    }));
  },
  updatePendingTransaction: (updateParams) => {
    const { transactions } = get();
    const updatedTransactions = transactions.map((tx) => {
      if (tx.uuid === updateParams.uuid) {
        tx.status = TransactionStatus.PENDING;
      }
      return tx;
    });
    set({
      transactions: updatedTransactions,
    });
  },
  updateConfirmedTransaction: (updateParams) => {
    const { transactions } = get();
    const updatedTransactions = transactions.map((tx) => {
      if (tx.uuid === updateParams.uuid) {
        tx.status = TransactionStatus.CONFIRMED;
        tx.txHash = updateParams.txHash;
        tx.description = tx.description;
      }
      return tx;
    });
    set({
      transactions: updatedTransactions,
    });
  },
  updateRejectedTransaction: (updateParams) => {
    const { transactions } = get();
    const updatedTransactions = transactions.map((tx) => {
      if (tx.uuid === updateParams.uuid) {
        tx.status = TransactionStatus.REJECTED;
        tx.error = updateParams.error;
      }
      return tx;
    });
    set({
      transactions: updatedTransactions,
    });
  },
  updateTransactionStatus: (updateParams) => {
    const { transactions } = get();
    const updatedTransactions = transactions.map((tx) => {
      if (tx.uuid === updateParams.uuid) {
        tx.status = updateParams.status ? updateParams.status : tx.status;
        tx.description = updateParams.description
          ? updateParams.description
          : tx.description;
      }
      return tx;
    });
    set({
      transactions: updatedTransactions,
    });
  },
}));

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function TransactionQueue() {
  const { open, closeQueue, transactions, action, purpose } =
    useTransactionStore();

  const fullScreen = window.innerWidth < 576;

  return (
    <Dialog
      className="m-auto max-w-[640px] text-center"
      open={open}
      onClose={() => closeQueue()}
      fullWidth={true}
      maxWidth={"sm"}
      TransitionComponent={Transition}
      fullScreen={fullScreen}
    >
      <DialogContent>
        <IconButton
          className="absolute top-0 right-0"
          onClick={() => closeQueue()}
        >
          <Close />
        </IconButton>
        {transactions.filter((tx) => {
          return ["DONE", "CONFIRMED"].includes(tx.status);
        }).length !== transactions.length && (
          <>
            <Typography className="block w-full text-center text-2xl">
              Transactions
            </Typography>
            <Typography className="block w-full text-center text-xl">
              {purpose ? purpose : "Pending Transactions"}
            </Typography>
            <div className="mb-3 rounded-xl border border-secondaryGray bg-primaryBg p-6">
              {transactions &&
                transactions.map((tx, idx) => {
                  return <Transaction transaction={tx} key={`${tx}${idx}`} />;
                })}
            </div>
          </>
        )}
        {transactions.filter((tx) => {
          return ["DONE", "CONFIRMED"].includes(tx.status);
        }).length === transactions.length && (
          <div className="m-auto max-w-[400px] pb-5 text-center">
            <div className="relative my-10 flex items-center justify-center">
              <span className="flex h-32 w-32 items-center justify-center rounded-full bg-[rgb(6,211,215)]/10"></span>
              <TaskAltRounded className="absolute top-1/2 left-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 text-[rgb(6,211,215)]" />
            </div>
            <Typography className="mt-5 mr-0 mb-2 ml-0 py-0 px-10 text-center text-xl font-bold">
              {action ? action : "Transaction Successful!"}
            </Typography>
            <Typography className="mb-10 py-0 px-10 text-center text-secondaryGray ">
              Transaction has been confirmed by the blockchain.
            </Typography>
            {transactions.length > 0 &&
              transactions
                .filter((tx) => {
                  return tx.txHash != null;
                })
                .map((tx, idx) => {
                  return (
                    <Typography
                      className="mx-auto mt-2 mb-5 bg-none text-sm"
                      key={`tx_key_${idx}`}
                    >
                      <a
                        href={`${ETHERSCAN_URL}tx/${tx?.txHash}`}
                        target="_blank"
                        className="text-cantoGreen underline hover:text-white hover:no-underline"
                      >
                        {tx && tx.description
                          ? tx.description
                          : "View in Explorer"}{" "}
                        <OpenInNew className="-mb-1 ml-1 text-base" />
                      </a>
                    </Typography>
                  );
                })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
