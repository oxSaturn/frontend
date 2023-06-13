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

import classes from "./transactionQueue.module.css";
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

  const renderDone = (txs: ITransaction["transactions"]) => {
    if (
      !(
        transactions &&
        transactions.filter((tx) => {
          return ["DONE", "CONFIRMED"].includes(tx.status);
        }).length === transactions.length
      )
    ) {
      return null;
    }

    return (
      <div className={classes.successDialog}>
        <div className="relative my-10 flex items-center justify-center">
          <span className="flex h-32 w-32 items-center justify-center rounded-full bg-[rgb(6,211,215)]/10"></span>
          <TaskAltRounded className="absolute top-1/2 left-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 text-[rgb(6,211,215)]" />
        </div>
        <Typography className={classes.successTitle}>
          {action ? action : "Transaction Successful!"}
        </Typography>
        <Typography className={classes.successText}>
          Transaction has been confirmed by the blockchain.
        </Typography>
        {txs &&
          txs.length > 0 &&
          txs
            .filter((tx) => {
              return tx.txHash != null;
            })
            .map((tx, idx) => {
              return (
                <Typography
                  className={classes.viewDetailsText}
                  key={`tx_key_${idx}`}
                >
                  <a href={`${ETHERSCAN_URL}tx/${tx?.txHash}`} target="_blank">
                    {tx && tx.description ? tx.description : "View in Explorer"}{" "}
                    <OpenInNew className={classes.newWindowIcon} />
                  </a>
                </Typography>
              );
            })}
      </div>
    );
  };

  const renderTransactions = (transactions: ITransaction["transactions"]) => {
    if (
      transactions &&
      transactions.filter((tx) => {
        return ["DONE", "CONFIRMED"].includes(tx.status);
      }).length === transactions.length
    ) {
      return null;
    }

    return (
      <>
        <div className={classes.headingContainer}>
          <Typography className={classes.heading}>
            {purpose ? purpose : "Pending Transactions"}
          </Typography>
        </div>
        <div className={classes.transactionsContainer}>
          {transactions &&
            transactions.map((tx, idx) => {
              return <Transaction transaction={tx} key={`${tx}${idx}`} />;
            })}
        </div>
      </>
    );
  };

  return (
    <Dialog
      className={classes.dialogScale}
      open={open}
      onClose={() => closeQueue()}
      fullWidth={true}
      maxWidth={"sm"}
      TransitionComponent={Transition}
      fullScreen={fullScreen}
    >
      <DialogContent>
        <IconButton
          className={classes.closeIconbutton}
          onClick={() => closeQueue()}
        >
          <Close />
        </IconButton>
        {renderTransactions(transactions)}
        {renderDone(transactions)}
      </DialogContent>
    </Dialog>
  );
}
