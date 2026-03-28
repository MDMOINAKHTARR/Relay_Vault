export const REGISTRY_ABI = [
  {
    "type": "function",
    "name": "register",
    "inputs": [
      { "name": "capabilities", "type": "bytes32[]" },
      { "name": "pricingModel", "type": "tuple", "components": [
          { "name": "basePrice", "type": "uint256" },
          { "name": "currency", "type": "address" },
          { "name": "pricingType", "type": "uint8" }
        ]
      },
      { "name": "routingConfig", "type": "bytes" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getAgent",
    "inputs": [{ "name": "agentId", "type": "address" }],
    "outputs": [
      { "name": "", "type": "tuple", "components": [
          { "name": "agentId", "type": "address" },
          { "name": "capabilities", "type": "bytes32[]" },
          { "name": "pricingModel", "type": "tuple", "components": [
              { "name": "basePrice", "type": "uint256" },
              { "name": "currency", "type": "address" },
              { "name": "pricingType", "type": "uint8" }
            ]
          },
          { "name": "reputationScore", "type": "uint256" },
          { "name": "vaultAddress", "type": "address" },
          { "name": "status", "type": "uint8" },
          { "name": "registeredAt", "type": "uint256" },
          { "name": "totalTasksCompleted", "type": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAllAgents",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "tuple[]", "components": [
          { "name": "agentId", "type": "address" },
          { "name": "capabilities", "type": "bytes32[]" },
          { "name": "pricingModel", "type": "tuple", "components": [
              { "name": "basePrice", "type": "uint256" },
              { "name": "currency", "type": "address" },
              { "name": "pricingType", "type": "uint8" }
            ]
          },
          { "name": "reputationScore", "type": "uint256" },
          { "name": "vaultAddress", "type": "address" },
          { "name": "status", "type": "uint8" },
          { "name": "registeredAt", "type": "uint256" },
          { "name": "totalTasksCompleted", "type": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "agentCount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  }
] as const;

export const NEGOTIATION_ABI = [
  {
    "type": "function",
    "name": "submitBid",
    "inputs": [
      { "name": "taskSpecCID", "type": "string" },
      { "name": "targetAgent", "type": "address" },
      { "name": "price", "type": "uint256" },
      { "name": "ttlBlocks", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bytes32" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "acceptBid",
    "inputs": [{ "name": "bidId", "type": "bytes32" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "counterBid",
    "inputs": [
      { "name": "bidId", "type": "bytes32" },
      { "name": "newPrice", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cancelBid",
    "inputs": [{ "name": "bidId", "type": "bytes32" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getBid",
    "inputs": [{ "name": "bidId", "type": "bytes32" }],
    "outputs": [
      { "name": "", "type": "tuple", "components": [
          { "name": "bidId", "type": "bytes32" },
          { "name": "taskSpecCID", "type": "string" },
          { "name": "initiator", "type": "address" },
          { "name": "targetAgent", "type": "address" },
          { "name": "price", "type": "uint256" },
          { "name": "ttlBlocks", "type": "uint256" },
          { "name": "state", "type": "uint8" },
          { "name": "counterHistory", "type": "tuple[]", "components": [
              { "name": "price", "type": "uint256" },
              { "name": "by", "type": "address" },
              { "name": "at", "type": "uint256" }
            ]
          },
          { "name": "createdAt", "type": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAgentBids",
    "inputs": [{ "name": "agent", "type": "address" }],
    "outputs": [{ "name": "", "type": "bytes32[]" }],
    "stateMutability": "view"
  }
] as const;

export const VAULT_ABI = [
  {
    "type": "function",
    "name": "withdraw",
    "inputs": [
      { "name": "amount", "type": "uint256" },
      { "name": "recipient", "type": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getBalance",
    "inputs": [],
    "outputs": [
      { "name": "available", "type": "uint256" },
      { "name": "locked", "type": "uint256" },
      { "name": "total", "type": "uint256" }
    ],
    "stateMutability": "view"
  }
] as const;

// Contract Addresses — automatically populated by scripts/deploy.ts
// If you've deployed, these should be in your .env.local file.
export const CONTRACT_ADDRESSES = {
  REGISTRY:    (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS    || '0x7a3f000000000000000000000000000000001b2c') as `0x${string}`,
  NEGOTIATION: (process.env.NEXT_PUBLIC_NEGOTIATION_ADDRESS || '0x9c1a000000000000000000000000000000004d5e') as `0x${string}`,
  ESCROW:      (process.env.NEXT_PUBLIC_ESCROW_ADDRESS      || '0x3b8d000000000000000000000000000000007f9a') as `0x${string}`,
  USDC:        (process.env.NEXT_PUBLIC_USDC_ADDRESS        || '0x1c2d000000000000000000000000000000003e4f') as `0x${string}`,
};
