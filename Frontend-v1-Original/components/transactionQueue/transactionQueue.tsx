import React, { useState, useEffect } from "react";
import {
  Typography,
  DialogContent,
  Dialog,
  Slide,
  IconButton,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import { OpenInNew, Close } from "@mui/icons-material";
import Lottie from "lottie-react";

import successAnim from "../../public/lottiefiles/successAnim.json";
import swapSuccessAnim from "../../public/lottiefiles/swapSuccess.json";
import lockSuccessAnim from "../../public/lottiefiles/lockSuccess.json";
import pairSuccessAnim from "../../public/lottiefiles/pairSuccess.json";


const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

import stores from "../../stores";
import { ACTIONS, ETHERSCAN_URL } from "../../stores/constants/constants";
import { ITransaction, TransactionStatus } from "../../stores/types/types";

import classes from "./transactionQueue.module.css";
import Transaction from "./transaction";

export default function TransactionQueue({
  setQueueLength,
}: {
  setQueueLength: (length: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [transactions, setTransactions] = useState<
    ITransaction["transactions"]
  >([]);
  const [purpose, setPurpose] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);

  const handleClose = () => {
    setOpen(false);
  };

  const fullScreen = window.innerWidth < 576;

  // const clearTransactions = () => {
  //   setTransactions([]);
  //   setQueueLength(0);
  // };

  const openQueue = () => {
    setOpen(true);
  };

  const transactionAdded = (params: ITransaction) => {
    setPurpose(params.title);
    setType(params.type);
    setAction(params.verb);
    setOpen(true);
    const txs = [...params.transactions];
    setTransactions(txs);

    setQueueLength(params.transactions.length);
  };

  const transactionPending = (
    params: Pick<ITransaction["transactions"][number], "uuid">
  ) => {
    let txs = transactions.map((tx) => {
      if (tx.uuid === params.uuid) {
        tx.status = TransactionStatus.PENDING;
      }
      return tx;
    });
    setTransactions(txs);
  };

  const transactionSubmitted = (
    params: Pick<ITransaction["transactions"][number], "uuid" | "txHash">
  ) => {
    let txs = transactions.map((tx) => {
      if (tx.uuid === params.uuid) {
        tx.status = TransactionStatus.SUBMITTED;
        tx.txHash = params.txHash;
      }
      return tx;
    });
    setTransactions(txs);
  };

  const transactionConfirmed = (
    params: Pick<ITransaction["transactions"][number], "uuid" | "txHash">
  ) => {
    let txs = transactions.map((tx) => {
      if (tx.uuid === params.uuid) {
        tx.status = TransactionStatus.CONFIRMED;
        tx.txHash = params.txHash;
        tx.description = tx.description;
      }
      return tx;
    });
    setTransactions(txs);
  };

  const transactionRejected = (
    params: Pick<ITransaction["transactions"][number], "uuid" | "error">
  ) => {
    let txs = transactions.map((tx) => {
      if (tx.uuid === params.uuid) {
        tx.status = TransactionStatus.REJECTED;
        tx.error = params.error;
      }
      return tx;
    });
    setTransactions(txs);
  };

  const transactionStatus = (
    params: Omit<ITransaction["transactions"][number], "error" | "txHash"> & {
      status?: string;
    }
  ) => {
    let txs = transactions.map((tx) => {
      if (tx.uuid === params.uuid) {
        tx.status = params.status ? params.status : tx.status;
        tx.description = params.description
          ? params.description
          : tx.description;
      }
      return tx;
    });
    setTransactions(txs);
  };

  useEffect(() => {
    // stores.emitter.on(ACTIONS.CLEAR_TRANSACTION_QUEUE, clearTransactions); TODO: we don't have impl for this one
    stores.emitter.on(ACTIONS.TX_ADDED, transactionAdded);
    stores.emitter.on(ACTIONS.TX_PENDING, transactionPending);
    stores.emitter.on(ACTIONS.TX_SUBMITTED, transactionSubmitted);
    stores.emitter.on(ACTIONS.TX_CONFIRMED, transactionConfirmed);
    stores.emitter.on(ACTIONS.TX_REJECTED, transactionRejected);
    stores.emitter.on(ACTIONS.TX_STATUS, transactionStatus);
    stores.emitter.on(ACTIONS.TX_OPEN, openQueue);

    return () => {
      // stores.emitter.removeListener(
      //   ACTIONS.CLEAR_TRANSACTION_QUEUE,
      //   clearTransactions
      // );
      stores.emitter.removeListener(ACTIONS.TX_ADDED, transactionAdded);
      stores.emitter.removeListener(ACTIONS.TX_PENDING, transactionPending);
      stores.emitter.removeListener(ACTIONS.TX_SUBMITTED, transactionSubmitted);
      stores.emitter.removeListener(ACTIONS.TX_CONFIRMED, transactionConfirmed);
      stores.emitter.removeListener(ACTIONS.TX_REJECTED, transactionRejected);
      stores.emitter.removeListener(ACTIONS.TX_STATUS, transactionStatus);
      stores.emitter.removeListener(ACTIONS.TX_OPEN, openQueue);
    };
  }, [transactions]);

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

    let lottie = (
      <Lottie
        loop={false}
        className={classes.animClass}
        animationData={successAnim}
      />
    );
    if (type === "Liquidity") {
      lottie = (
        <Lottie
          loop={false}
          className={classes.animClass}
          animationData={pairSuccessAnim}
        />
      );
    } else if (type === "Swap") {
      lottie = (
        <Lottie
          loop={false}
          className={classes.animClass}
          animationData={swapSuccessAnim}
        />
      );
    } else if (type === "Vest") {
      lottie = (
        <Lottie
          loop={false}
          className={classes.animClass}
          animationData={lockSuccessAnim}
        />
      );
    }

    return (
      <div className={classes.successDialog}>
        {lottie}
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
      onClose={handleClose}
      fullWidth={true}
      maxWidth={"sm"}
      TransitionComponent={Transition}
      fullScreen={fullScreen}
    >
      <DialogContent>
        <IconButton className={classes.closeIconbutton} onClick={handleClose}>
          <Close />
        </IconButton>
        {renderTransactions(transactions)}
        {renderDone(transactions)}
      </DialogContent>
    </Dialog>
  );
}
