/**
 * RelayVault Mock Data
 *
 * Raw agent inputs are defined here (task counts, dispute history, response
 * times, capacity, financials).  NO scores are hardcoded — all of them
 * (reputationScore, availabilityScore, disputeRate, bondCollateral) are
 * computed at module load time by the scoring engine in scoring.ts.
 *
 * To simulate a score change, change the raw inputs below and the scores
 * update automatically everywhere in the app.
 */

import {
  computeAgent,
  computeRequiredBond,
  type AgentRawData,
  type Agent,
} from './scoring';

// ── Exported types (re-exported so consumers don't need two imports) ──────────
export type { Agent };
export type EscrowState = 'PENDING_LOCK' | 'LOCKED' | 'COMPLETED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED' | 'EXPIRED';
export type BidState    = 'OPEN' | 'COUNTERED' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
export type VerificationMethod = 'ORACLE' | 'AUTOMATED' | 'OPTIMISTIC' | 'HUMAN' | 'SELF_REPORT';

// ── Raw agent data (only real inputs — no pre-computed scores) ────────────────

const RAW_AGENTS: AgentRawData[] = [
  {
    agentId: '0x7a3f000000000000000000000000000000001b2c',
    name: 'CodeGen Alpha',
    avatar: 'CGA',
    capabilities: ['code:generation:solidity', 'code:generation:typescript', 'code:review:security'],
    pricingModel: { basePrice: 45, currency: 'USDC', pricingType: 'FIXED' },
    vaultAddress: '0xVault7a3f',
    status: 'ACTIVE',
    registeredAt: '2026-01-15',
    description: 'Specialized in Solidity smart contract generation and TypeScript backend code. Audited 200+ contracts with zero critical vulnerabilities.',

    // Task history
    totalTasksCompleted: 312,
    totalTasksAttempted: 315,     // 315 − 312 = 3 failed/disputed

    // Dispute history → disputeWinRate = 2/3
    totalDisputes: 3,
    wonDisputes: 2,

    // Financial
    totalEarnings: 48200,
    lockedBond: 4820,             // 10% of totalEarnings locked as bond

    // Response time (fast agent)
    avgResponseTimeMs: 4 * 60 * 1000,    // 4 minutes avg
    p50ResponseTimeMs: 15 * 60 * 1000,   // network P50

    // Capacity
    activeTasks: 2,
    maxCapacity: 10,
  },
  {
    agentId: '0x9c1a000000000000000000000000000000004d5e',
    name: 'ResearchBot Pro',
    avatar: 'RBP',
    capabilities: ['data:research:web-scraping', 'data:research:academic', 'finance:analysis:risk'],
    pricingModel: { basePrice: 28, currency: 'USDC', pricingType: 'AUCTION' },
    vaultAddress: '0xVault9c1a',
    status: 'ACTIVE',
    registeredAt: '2026-01-22',
    description: 'Deep research agent specializing in financial data, academic papers, and real-time web scraping. Sub-second data retrieval on demand.',

    totalTasksCompleted: 198,
    totalTasksAttempted: 204,

    totalDisputes: 4,
    wonDisputes: 2,

    totalEarnings: 31400,
    lockedBond: 3140,

    avgResponseTimeMs: 18 * 60 * 1000,
    p50ResponseTimeMs: 15 * 60 * 1000,

    activeTasks: 3,
    maxCapacity: 10,
  },
  {
    agentId: '0x3b8d000000000000000000000000000000007f9a',
    name: 'DataAnalyst X',
    avatar: 'DAX',
    capabilities: ['finance:analysis:risk', 'finance:analysis:portfolio', 'data:research:academic'],
    pricingModel: { basePrice: 60, currency: 'USDC', pricingType: 'DYNAMIC' },
    vaultAddress: '0xVault3b8d',
    status: 'ACTIVE',
    registeredAt: '2025-12-08',
    description: 'Elite quantitative analysis agent. Processes terabytes of financial data with ML models for risk and portfolio optimization.',

    totalTasksCompleted: 441,
    totalTasksAttempted: 443,

    totalDisputes: 2,
    wonDisputes: 2,

    totalEarnings: 72100,
    lockedBond: 7210,

    avgResponseTimeMs: 6 * 60 * 1000,
    p50ResponseTimeMs: 15 * 60 * 1000,

    activeTasks: 7,
    maxCapacity: 10,
  },
  {
    agentId: '0x5e2f000000000000000000000000000000008b3c',
    name: 'OracleNode Prime',
    avatar: 'ONP',
    capabilities: ['data:oracle:price-feed', 'data:oracle:weather', 'data:oracle:sports'],
    pricingModel: { basePrice: 12, currency: 'USDC', pricingType: 'FIXED' },
    vaultAddress: '0xVault5e2f',
    status: 'ACTIVE',
    registeredAt: '2025-11-30',
    description: 'High-frequency oracle agent with 99.98% uptime. Aggregates data from 50+ sources with cryptographic proof of integrity.',

    totalTasksCompleted: 2841,
    totalTasksAttempted: 2844,

    totalDisputes: 3,
    wonDisputes: 3,

    totalEarnings: 104300,
    lockedBond: 10430,

    avgResponseTimeMs: 0.8 * 60 * 1000,
    p50ResponseTimeMs: 15 * 60 * 1000,

    activeTasks: 1,
    maxCapacity: 100,
  },
  {
    agentId: '0xb1c9000000000000000000000000000000002e4f',
    name: 'LegalEagle AI',
    avatar: 'LEA',
    capabilities: ['legal:analysis:contracts', 'legal:drafting:nda', 'compliance:review:dao'],
    pricingModel: { basePrice: 120, currency: 'USDC', pricingType: 'AUCTION' },
    vaultAddress: '0xVaultb1c9',
    status: 'ACTIVE',
    registeredAt: '2026-02-01',
    description: 'Smart contract legal analysis and DAO governance compliance. Trained on 10K+ DeFi protocols legal frameworks.',

    totalTasksCompleted: 87,
    totalTasksAttempted: 91,

    totalDisputes: 4,
    wonDisputes: 2,

    totalEarnings: 18900,
    lockedBond: 1890,

    avgResponseTimeMs: 35 * 60 * 1000,
    p50ResponseTimeMs: 15 * 60 * 1000,

    activeTasks: 2,
    maxCapacity: 8,
  },
  {
    agentId: '0xd7e3000000000000000000000000000000006a1b',
    name: 'MediaSynth',
    avatar: 'MSY',
    capabilities: ['media:generation:images', 'media:generation:video', 'media:editing:audio'],
    pricingModel: { basePrice: 35, currency: 'USDC', pricingType: 'FIXED' },
    vaultAddress: '0xVaultd7e3',
    status: 'ACTIVE',
    registeredAt: '2026-01-10',
    description: 'Multimodal media generation agent. Creates production-ready assets for DeFi protocol marketing and DAO communications.',

    totalTasksCompleted: 264,
    totalTasksAttempted: 270,

    totalDisputes: 6,
    wonDisputes: 4,

    totalEarnings: 39600,
    lockedBond: 3960,

    avgResponseTimeMs: 12 * 60 * 1000,
    p50ResponseTimeMs: 15 * 60 * 1000,

    activeTasks: 1,
    maxCapacity: 8,
  },
  {
    agentId: '0xf4a2000000000000000000000000000000009c7d',
    name: 'AuditHound',
    avatar: 'AHD',
    capabilities: ['code:review:security', 'code:audit:defi', 'code:testing:fuzzing'],
    pricingModel: { basePrice: 200, currency: 'USDC', pricingType: 'DYNAMIC' },
    vaultAddress: '0xVaultf4a2',
    status: 'ACTIVE',
    registeredAt: '2025-12-20',
    description: 'Security audit specialist with zero false negatives on critical severity bugs. Runs 10M+ fuzzing iterations per audit.',

    totalTasksCompleted: 156,
    totalTasksAttempted: 156,    // perfect completion rate

    totalDisputes: 0,
    wonDisputes: 0,

    totalEarnings: 89400,
    lockedBond: 8940,

    avgResponseTimeMs: 2 * 60 * 1000,
    p50ResponseTimeMs: 15 * 60 * 1000,

    activeTasks: 5,
    maxCapacity: 8,
  },
  {
    agentId: '0xa8b5000000000000000000000000000000003f2e',
    name: 'TranslatorMesh',
    avatar: 'TRM',
    capabilities: ['language:translation:technical', 'language:localization:web3', 'language:summary:documents'],
    pricingModel: { basePrice: 18, currency: 'USDC', pricingType: 'FIXED' },
    vaultAddress: '0xVaulta8b5',
    status: 'ACTIVE',
    registeredAt: '2026-02-14',
    description: 'Technical translation for 40+ languages with Web3 glossary expansion. Specializes in whitepaper localization.',

    totalTasksCompleted: 423,
    totalTasksAttempted: 426,

    totalDisputes: 3,
    wonDisputes: 2,

    totalEarnings: 22100,
    lockedBond: 2210,

    avgResponseTimeMs: 7 * 60 * 1000,
    p50ResponseTimeMs: 15 * 60 * 1000,

    activeTasks: 1,
    maxCapacity: 20,
  },
  {
    agentId: '0xc3d6000000000000000000000000000000001a9b',
    name: 'GovernanceBot',
    avatar: 'GVB',
    capabilities: ['compliance:review:dao', 'governance:voting:analysis', 'governance:proposal:drafting'],
    pricingModel: { basePrice: 55, currency: 'USDC', pricingType: 'AUCTION' },
    vaultAddress: '0xVaultc3d6',
    status: 'ACTIVE',
    registeredAt: '2026-01-05',
    description: 'DAO governance specialist. Analyzes proposal impact, drafts governance documentation, and monitors voting outcomes on 20+ protocols.',

    totalTasksCompleted: 189,
    totalTasksAttempted: 193,

    totalDisputes: 4,
    wonDisputes: 3,

    totalEarnings: 41200,
    lockedBond: 4120,

    avgResponseTimeMs: 11 * 60 * 1000,
    p50ResponseTimeMs: 15 * 60 * 1000,

    activeTasks: 3,
    maxCapacity: 10,
  },
  {
    agentId: '0xe5f8000000000000000000000000000000004c3a',
    name: 'InferenceNode',
    avatar: 'IFN',
    capabilities: ['ai:inference:classification', 'ai:inference:embedding', 'data:processing:pipeline'],
    pricingModel: { basePrice: 8, currency: 'USDC', pricingType: 'DYNAMIC' },
    vaultAddress: '0xVaulte5f8',
    status: 'ACTIVE',
    registeredAt: '2025-11-15',
    description: 'High-throughput inference agent serving 500K+ classifications daily. Offers competitive per-token pricing with batch discounts.',

    totalTasksCompleted: 1842,
    totalTasksAttempted: 1851,

    totalDisputes: 8,
    wonDisputes: 7,

    totalEarnings: 67300,
    lockedBond: 6730,

    avgResponseTimeMs: 1.5 * 60 * 1000,
    p50ResponseTimeMs: 15 * 60 * 1000,

    activeTasks: 9,
    maxCapacity: 100,
  },
];

/**
 * AGENTS — raw inputs passed through computeAgent() so all scores are live.
 * Changing any raw field above automatically propagates through every score.
 */
export const AGENTS: Agent[] = RAW_AGENTS.map(computeAgent);

// Convenience export — "my" agent for dashboard/vault views
export const MY_AGENT: Agent = AGENTS[0]; // CodeGen Alpha

// ── Escrow / Bid / Transaction data ──────────────────────────────────────────
// (These are not scored — they are factual state records)

export interface Escrow {
  escrowId: string;
  bidId: string;
  payer: string;
  payerName: string;
  receiver: string;
  receiverName: string;
  amount: number;
  deadline: string;
  state: EscrowState;
  verificationMethod: VerificationMethod;
  taskSpec: string;
  createdAt: string;
  completedAt?: string;
}

export interface Bid {
  bidId: string;
  taskSpec: string;
  initiator: string;
  initiatorName: string;
  targetAgent: string;
  targetName: string;
  price: number;
  ttlBlocks: number;
  state: BidState;
  createdAt: string;
  counterHistory: { price: number; by: string; at: string }[];
}

export interface TransactionEvent {
  id: string;
  type: string;
  escrowId?: string;
  amount?: number;
  from?: string;
  to?: string;
  agentId?: string;
  blockNumber: number;
  timestamp: string;
  txHash: string;
  ipfsCID?: string;
  state?: EscrowState;
}

export const ESCROWS: Escrow[] = [
  {
    escrowId: 'ESC-001',
    bidId: 'BID-001',
    payer: '0xAgent...A1',
    payerName: 'ResearchBot Pro',
    receiver: '0xAgent...B2',
    receiverName: 'CodeGen Alpha',
    amount: 250,
    deadline: '2026-03-30T12:00:00Z',
    state: 'LOCKED',
    verificationMethod: 'ORACLE',
    taskSpec: 'QmTaskSpec...abc123',
    createdAt: '2026-03-27T08:00:00Z',
  },
  {
    escrowId: 'ESC-002',
    bidId: 'BID-002',
    payer: '0xAgent...C3',
    payerName: 'GovernanceBot',
    receiver: '0xAgent...D4',
    receiverName: 'LegalEagle AI',
    amount: 1200,
    deadline: '2026-04-02T00:00:00Z',
    state: 'COMPLETED',
    verificationMethod: 'HUMAN',
    taskSpec: 'QmTaskSpec...def456',
    createdAt: '2026-03-24T14:00:00Z',
    completedAt: '2026-03-26T09:30:00Z',
  },
  {
    escrowId: 'ESC-003',
    bidId: 'BID-003',
    payer: '0xAgent...E5',
    payerName: 'DataAnalyst X',
    receiver: '0xAgent...F6',
    receiverName: 'AuditHound',
    amount: 4500,
    deadline: '2026-04-05T00:00:00Z',
    state: 'LOCKED',
    verificationMethod: 'AUTOMATED',
    taskSpec: 'QmTaskSpec...ghi789',
    createdAt: '2026-03-26T10:00:00Z',
  },
];

export const BIDS: Bid[] = [
  {
    bidId: 'BID-007',
    taskSpec: 'QmSpec...xyz001',
    initiator: '0xAgentA',
    initiatorName: 'InferenceNode',
    targetAgent: '0xAgentB',
    targetName: 'CodeGen Alpha',
    price: 120,
    ttlBlocks: 100,
    state: 'COUNTERED',
    createdAt: '2026-03-27T10:00:00Z',
    counterHistory: [
      { price: 120, by: 'InferenceNode', at: '2026-03-27T10:00:00Z' },
      { price: 95, by: 'CodeGen Alpha', at: '2026-03-27T10:15:00Z' },
    ],
  },
  {
    bidId: 'BID-008',
    taskSpec: 'QmSpec...xyz002',
    initiator: '0xAgentC',
    initiatorName: 'GovernanceBot',
    targetAgent: '0xAgentD',
    targetName: 'LegalEagle AI',
    price: 200,
    ttlBlocks: 150,
    state: 'OPEN',
    createdAt: '2026-03-27T11:00:00Z',
    counterHistory: [
      { price: 200, by: 'GovernanceBot', at: '2026-03-27T11:00:00Z' },
    ],
  },
];

export const TRANSACTIONS: TransactionEvent[] = [
  { id: 'tx-001', type: 'FundsReleased', escrowId: 'ESC-099', amount: 750, from: 'TaskEscrow', to: 'CodeGen Alpha', blockNumber: 8124521, timestamp: '2026-03-27T10:45:00Z', txHash: '0xhash...aaa', state: 'RELEASED', ipfsCID: 'QmProof...aaa' },
  { id: 'tx-002', type: 'FundsLocked',   escrowId: 'ESC-100', amount: 4500, from: 'DataAnalyst X', to: 'TaskEscrow', blockNumber: 8124499, timestamp: '2026-03-27T09:30:00Z', txHash: '0xhash...bbb', state: 'LOCKED' },
  { id: 'tx-003', type: 'BidAccepted',   escrowId: 'ESC-101', amount: 250, from: 'ResearchBot Pro', to: 'CodeGen Alpha', blockNumber: 8124432, timestamp: '2026-03-27T08:00:00Z', txHash: '0xhash...ccc', state: 'PENDING_LOCK' },
  { id: 'tx-004', type: 'BondSlashed',   agentId: '0xAgent...XY', amount: 180, blockNumber: 8124310, timestamp: '2026-03-26T21:15:00Z', txHash: '0xhash...ddd' },
  { id: 'tx-005', type: 'ReputationUpdated', agentId: '0xAgent...ZZ', blockNumber: 8124288, timestamp: '2026-03-26T20:00:00Z', txHash: '0xhash...eee' },
  { id: 'tx-006', type: 'FundsReleased', escrowId: 'ESC-098', amount: 1200, from: 'TaskEscrow', to: 'LegalEagle AI', blockNumber: 8124200, timestamp: '2026-03-26T15:30:00Z', txHash: '0xhash...fff', state: 'RELEASED', ipfsCID: 'QmProof...bbb' },
];

/**
 * Vault routing config for MY_AGENT's VaultWallet.
 * Percentages are stored as raw fractions — the split amounts shown
 * in the UI are always calculated as: fraction × incoming payment.
 */
export const VAULT_ROUTING = {
  holdFraction:   0.50,   // 50% → available balance
  lockFraction:   0.20,   // 20% → time-locked bond
  splitFraction:  0.30,   // 30% → auto-split to sub-agents (sum of splitRecipients BPS)
  splitRecipients: [
    { address: '0xSubAgent...001', name: 'Sub-Agent Alpha', bps: 1500 },
    { address: '0xSubAgent...002', name: 'Sub-Agent Beta',  bps: 1000 },
    { address: '0xTreasury...001', name: 'DAO Treasury',    bps: 500  },
  ],
  timeLocks: [
    { amount: 1200, unlockDate: '2026-04-15', taskId: 'ESC-001' },
    { amount: 800,  unlockDate: '2026-05-01', taskId: 'ESC-003' },
  ],
};
