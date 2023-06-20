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

export default function Transaction({
  transaction,
}: {
  transaction: ITransaction["transactions"][number];
}) {
  const [expanded, setExpanded] = useState(false);

  const mapStatusToIcon = (status: TransactionStatus) => {
    switch (status) {
      case "WAITING":
        return <Pause className="text-[#ffc512]" />;
      case "PENDING":
        return <HourglassEmpty className="text-[#49a766]" />;
      case "SUBMITTED":
        return <HourglassFull className="text-[#49a766]" />;
      case "CONFIRMED":
        return <CheckCircle className="text-[#49a766]" />;
      case "REJECTED":
        return <Error className="text-red-500" />;
      case "DONE":
        return <CheckCircle className="text-[#49a766]" />;
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
    <div
      className="cursor-pointer p-3 hover:bg-[rgba(0,0,0,0.2)]"
      key={transaction.uuid}
    >
      <div
        className="flex items-center justify-between"
        onClick={onExpendTransaction}
      >
        <Typography>{transaction.description}</Typography>
        <Tooltip title={mapStatusToTootip(transaction.status)}>
          {mapStatusToIcon(transaction.status)}
        </Tooltip>
      </div>
      {expanded && (
        <>
          {transaction.txHash && (
            <div className="flex w-full items-center justify-between">
              <Typography color="textSecondary">
                {formatAddress(transaction.txHash, "long")}
              </Typography>
              <Button onClick={onViewTX}>View in Explorer</Button>
            </div>
          )}
          {transaction?.error && (
            <Typography className="pt-3 text-red-500">
              {transaction?.error}
            </Typography>
          )}
        </>
      )}
    </div>
  );
}
