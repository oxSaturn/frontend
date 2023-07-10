export const bribeFactoryABI = [
  {
    inputs: [
      {
        internalType: "address[]",
        name: "allowedRewards",
        type: "address[]",
      },
    ],
    name: "createExternalBribe",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "last_external_bribe",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
