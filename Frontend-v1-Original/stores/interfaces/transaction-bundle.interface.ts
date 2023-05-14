export interface TransactionBundle {
  title: string;
  // should probably be created into an enumeration for simplicity
  type: string;
  verb: string;
  transactions: {
    uuid: string;
    description: string;
    // should probably be created into an enumeration for simplicity
    status: string;
  }[];
}
