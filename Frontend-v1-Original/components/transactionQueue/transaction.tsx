import { useState } from "react";
import { Typography, Button, Tooltip } from "@mui/material";
import {
  HourglassEmpty,
  HourglassFull,
  CheckCircle,
  Error,
  Pause,
} from "@mui/icons-material";

import { ETHERSCAN_URL } from "../../stores/constants/constants";
import { formatAddress } from "../../utils/utils";
import { TransactionStatus, ITransaction } from "../../stores/types/types";

import classes from "./transactionQueue.module.css";

export default function Transaction({
  transaction,
}: {
  transaction: ITransaction["transactions"][number];
}) {
  const [expanded, setExpanded] = useState(false);

  const mapStatusToIcon = (status: TransactionStatus) => {
    switch (status) {
      case "WAITING":
        return <Pause className={classes.orangeIcon} />;
      case "PENDING":
        return <HourglassEmpty className={classes.greenIcon} />;
      case "SUBMITTED":
        return <HourglassFull className={classes.greenIcon} />;
      case "CONFIRMED":
        return <CheckCircle className={classes.greenIcon} />;
      case "REJECTED":
        return <Error className={classes.redIcon} />;
      case "DONE":
        return <CheckCircle className={classes.greenIcon} />;
      default:
        return <div />;
    }
  };

  const mapStatusToTootip = (status: TransactionStatus) => {
    switch (status) {
      case "WAITING":
        return "Transaction will be submitted once ready";
      case "PENDING":
        return "Transaction is pending your approval in your wallet";
      case "SUBMITTED":
        return "Transaction has been submitted to the blockchain and we are waiting on confirmation.";
      case "CONFIRMED":
        return "Transaction has been confirmed by the blockchain.";
      case "REJECTED":
        return "Transaction has been rejected.";
      default:
        return "";
    }
  };

  const onExpendTransaction = () => {
    setExpanded(!expanded);
  };

  const onViewTX = () => {
    window.open(`${ETHERSCAN_URL}tx/${transaction.txHash}`, "_blank");
  };

  return (
    <div className={classes.transaction} key={transaction.uuid}>
      <div className={classes.transactionInfo} onClick={onExpendTransaction}>
        <Typography className={classes.transactionDescription}>
          {transaction.description}
        </Typography>
        <Tooltip title={mapStatusToTootip(transaction.status)}>
          {mapStatusToIcon(transaction.status)}
        </Tooltip>
      </div>
      {expanded && (
        <div className={classes.transactionExpanded}>
          {transaction.txHash && (
            <div className={classes.transaactionHash}>
              <Typography color="textSecondary">
                {formatAddress(transaction.txHash, "long")}
              </Typography>
              <Button onClick={onViewTX}>View in Explorer</Button>
            </div>
          )}
          {transaction?.error && (
            <Typography className={classes.errorText}>
              {transaction?.error}
            </Typography>
          )}
        </div>
      )}
    </div>
  );
}
