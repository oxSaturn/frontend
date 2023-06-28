import { forwardRef } from "react";
import { create } from "zustand";
import {
  DialogContent,
  Dialog,
  Slide,
  IconButton,
  Typography,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import { Close } from "@mui/icons-material";

import { ITransaction, TransactionStatus } from "../../stores/types/types";

import Transaction from "./transaction";

interface TransactionStore {
  transactions: ITransaction["transactions"];
  open: boolean;
  clearTransactions: () => void;
  openQueue: () => void;
  closeQueue: () => void;
  updateTransactionQueue: (_updateQueue: {
    transactions: ITransaction["transactions"];
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
  updateTransactionQueue: (updateParams) => {
    get().addTransactions(updateParams.transactions);
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
  const { open, closeQueue, transactions, clearTransactions } =
    useTransactionStore();

  const fullScreen = window.innerWidth < 576;

  return (
    <Dialog
      className="m-auto max-w-[640px]"
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
        <div className="flex flex-col items-start gap-3">
          <div className="block w-full text-2xl">Recent Transactions</div>
          <button
            onClick={() => clearTransactions()}
            className="underline hover:no-underline"
          >
            Clear all
          </button>
          <div className="mb-3 w-full divide-y rounded-xl border border-secondary bg-primaryBg p-6">
            {transactions.length > 0 ? (
              transactions.map((tx, idx) => {
                return <Transaction transaction={tx} key={`${tx}${idx}`} />;
              })
            ) : (
              <Typography>Your transactions will appear here</Typography>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
