export const bribeFactoryABI = [
  {
    type: "constructor",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "_voter", internalType: "address" },
      { type: "uint256", name: "_csrNftId", internalType: "uint256" },
    ],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [{ type: "address", name: "", internalType: "address" }],
    name: "TURNSTILE",
    inputs: [],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    outputs: [{ type: "address", name: "", internalType: "address" }],
    name: "createBribe",
    inputs: [
      { type: "address", name: "existing_bribe", internalType: "address" },
    ],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [{ type: "uint256", name: "", internalType: "uint256" }],
    name: "csrNftId",
    inputs: [],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [{ type: "address", name: "", internalType: "address" }],
    name: "last_bribe",
    inputs: [],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [{ type: "address", name: "", internalType: "address" }],
    name: "oldBribeToNew",
    inputs: [{ type: "address", name: "", internalType: "address" }],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [{ type: "address", name: "", internalType: "address" }],
    name: "voter",
    inputs: [],
  },
] as const;
