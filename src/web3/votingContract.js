export const VOTING_CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS || "0xC9154bfC663f2e3B212EA79A90e6c73c1Cec0Af9";

export const votingAbi = [
  {
    type: "function",
    name: "getPollCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "getPoll",
    stateMutability: "view",
    inputs: [{ name: "pollId", type: "uint256" }],
    outputs: [
      { name: "pollId", type: "uint256" },
      { name: "contentHash", type: "bytes32" },
      { name: "deadline", type: "uint256" },
      { name: "isActive", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "optionCount",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }]
  },
  {
    type: "function",
    name: "vote",
    stateMutability: "nonpayable",
    inputs: [
      { name: "pollId", type: "uint256" },
      { name: "option", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "createPoll",
    stateMutability: "nonpayable",
    inputs: [
      { name: "contentHash", type: "bytes32" },
      { name: "deadline", type: "uint256" },
      { name: "optionCount", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "endPoll",
    stateMutability: "nonpayable",
    inputs: [{ name: "pollId", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "addToWhitelist",
    stateMutability: "nonpayable",
    inputs: [
      { name: "pollId", type: "uint256" },
      { name: "voters", type: "address[]" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "isWhitelisted",
    stateMutability: "view",
    inputs: [
      { name: "pollId", type: "uint256" },
      { name: "voter", type: "address" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "hasUserVoted",
    stateMutability: "view",
    inputs: [
      { name: "pollId", type: "uint256" },
      { name: "voter", type: "address" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "getVoteCount",
    stateMutability: "view",
    inputs: [
      { name: "pollId", type: "uint256" },
      { name: "option", type: "uint256" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "event",
    name: "WhitelistBatchAdded",
    inputs: [
      { name: "pollId", type: "uint256", indexed: false },
      { name: "count", type: "uint256", indexed: false }
    ],
    anonymous: false
  }
];

export const votingContract = {
  address: VOTING_CONTRACT_ADDRESS,
  abi: votingAbi
};
