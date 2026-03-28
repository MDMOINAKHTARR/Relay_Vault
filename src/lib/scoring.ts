/**
 * RelayVault Scoring Engine
 *
 * All agent scores are derived from raw operational data.
 * No hardcoded score values — every number is computed from inputs.
 *
 * ── Reputation Score (0–1000) ──────────────────────────────────────────────
 * Based on PRD §5.1.4. Four weighted components:
 *
 *   Component                  Weight   Formula
 *   ─────────────────────────  ──────   ─────────────────────────────────────
 *   Task completion rate        40%     completedTasks / totalTasks × 400
 *   Dispute win rate            30%     wonDisputes / max(1, totalDisputes) × 300
 *   Bond collateral ratio       20%     min(lockedBond / requiredBond, 1) × 200
 *   Response time percentile    10%     (1 − normalizedResponseMs) × 100
 *
 *   Total = sum of the four components, clamped to [0, 1000].
 *
 * ── Availability Score (0–100) ─────────────────────────────────────────────
 *   = (1 − activeTasks / maxCapacity) × 100
 *   Agents with more active tasks appear lower in discovery rankings.
 *
 * ── Bond Collateral (USDC) ─────────────────────────────────────────────────
 *   Derived from PRD §5.6.1 tier table applied to total lifetime earnings.
 *   Represents the minimum required bond for the agent's typical task size.
 *
 * ── Dispute Rate (%) ───────────────────────────────────────────────────────
 *   = totalDisputes / max(1, totalTasksCompleted) × 100
 *
 * ── Required Bond (USDC) ───────────────────────────────────────────────────
 *   Task value tier lookup per PRD §5.6.1.
 */

// ── Types ────────────────────────────────────────────────────────────────────

/** Raw operational inputs for an agent — no pre-computed scores. */
export interface AgentRawData {
  agentId: string;
  name: string;
  avatar: string;
  description: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  registeredAt: string;
  vaultAddress: string;

  // Task history (drives completion rate and dispute rate)
  totalTasksCompleted: number; // Tasks in RELEASED state
  totalTasksAttempted: number; // totalTasksCompleted + failed/disputed tasks

  // Dispute history (drives reputation + dispute rate)
  totalDisputes: number;       // All disputes ever opened
  wonDisputes: number;         // Disputes resolved in this agent's favour

  // Financial data
  totalEarnings: number;       // Cumulative USDC received through VaultWallet
  lockedBond: number;          // USDC currently in timeLock (from VaultWallet)

  // Timing data — used for response time percentile
  avgResponseTimeMs: number;   // Average ms from bid acceptance to verifyAndRelease call
  p50ResponseTimeMs: number;   // 50th percentile reference across all registered agents

  // Capacity (from agent's declared maxTaskCapacity)
  activeTasks: number;         // Current escrows in LOCKED state
  maxCapacity: number;         // Agent's self-declared concurrent task limit

  // Pricing
  pricingModel: {
    basePrice: number;
    currency: string;
    pricingType: 'FIXED' | 'AUCTION' | 'DYNAMIC';
  };

  capabilities: string[];
}

/** Fully computed agent — all scores derived from AgentRawData. */
export interface Agent extends AgentRawData {
  reputationScore: number;  // 0–1000, from computeReputationScore()
  availabilityScore: number; // 0–100, from computeAvailabilityScore()
  bondCollateral: number;   // USDC, derived from lockedBond (= raw input)
  disputeRate: number;      // %, from computeDisputeRate()
}

// ── Scoring constants ─────────────────────────────────────────────────────────

/** PRD §5.1.4 reputation weight configuration. Change weights here only. */
const REPUTATION_WEIGHTS = {
  taskCompletionRate: 0.40,  // 40% → max 400 pts
  disputeWinRate:     0.30,  // 30% → max 300 pts
  bondRatio:          0.20,  // 20% → max 200 pts
  responseTime:       0.10,  // 10% → max 100 pts
} as const;

const MAX_REPUTATION = 1000;

/**
 * The "worst-case" response time cap used to normalise avgResponseTimeMs.
 * Any agent responding slower than this gets 0 pts for the response component.
 * Set to 24 hours in ms — represents unacceptably slow agents.
 */
const RESPONSE_TIME_WORST_MS = 24 * 60 * 60 * 1000;

// ── Core scoring functions ────────────────────────────────────────────────────

/**
 * Compute weighted reputation score per PRD §5.1.4.
 *
 * @param raw - Raw agent operational data
 * @returns Integer in [0, 1000]
 */
export function computeReputationScore(raw: AgentRawData): number {
  // Component A: task completion rate (0–400)
  const completionRate =
    raw.totalTasksAttempted === 0
      ? 0
      : raw.totalTasksCompleted / raw.totalTasksAttempted;
  const completionPts = completionRate * REPUTATION_WEIGHTS.taskCompletionRate * MAX_REPUTATION;

  // Component B: dispute win rate (0–300)
  // If no disputes, full points — a dispute-free history is perfect.
  const disputeWinRate =
    raw.totalDisputes === 0 ? 1 : raw.wonDisputes / raw.totalDisputes;
  const disputePts = disputeWinRate * REPUTATION_WEIGHTS.disputeWinRate * MAX_REPUTATION;

  // Component C: bond collateral ratio (0–200)
  // Ratio of locked bond vs the minimum required bond for this agent's avg task value.
  const avgTaskValue =
    raw.totalTasksCompleted === 0
      ? 0
      : raw.totalEarnings / raw.totalTasksCompleted;
  const requiredBond = computeRequiredBond(avgTaskValue);
  const bondRatio =
    requiredBond === 0 ? 1 : Math.min(raw.lockedBond / requiredBond, 1);
  const bondPts = bondRatio * REPUTATION_WEIGHTS.bondRatio * MAX_REPUTATION;

  // Component D: response time percentile (0–100)
  // Lower response time → higher score. Capped at RESPONSE_TIME_WORST_MS.
  const clampedMs = Math.min(raw.avgResponseTimeMs, RESPONSE_TIME_WORST_MS);
  const responseScore = 1 - clampedMs / RESPONSE_TIME_WORST_MS;
  const responsePts = responseScore * REPUTATION_WEIGHTS.responseTime * MAX_REPUTATION;

  const total = completionPts + disputePts + bondPts + responsePts;
  return Math.round(Math.max(0, Math.min(MAX_REPUTATION, total)));
}

/**
 * Compute availability score per PRD §5.7.1.
 *
 * @returns Integer in [0, 100]; 100 = fully available, 0 = at capacity
 */
export function computeAvailabilityScore(raw: AgentRawData): number {
  if (raw.maxCapacity === 0) return 0;
  const ratio = 1 - raw.activeTasks / raw.maxCapacity;
  return Math.round(Math.max(0, Math.min(100, ratio * 100)));
}

/**
 * Compute dispute rate as a percentage of all completed tasks.
 *
 * @returns Float in [0, 100]
 */
export function computeDisputeRate(raw: AgentRawData): number {
  if (raw.totalTasksCompleted === 0) return 0;
  const rate = (raw.totalDisputes / raw.totalTasksCompleted) * 100;
  return Math.round(rate * 10) / 10; // 1 decimal place
}

/**
 * Minimum bond required for a given task value.
 * Implements the PRD §5.6.1 tier lookup table.
 *
 * @param taskValueUsdc - Task value in USDC
 * @returns Required bond in USDC
 */
export function computeRequiredBond(taskValueUsdc: number): number {
  if (taskValueUsdc < 100)   return 0;                           // No bond required
  if (taskValueUsdc < 1000)  return taskValueUsdc * 0.10;        // 10% bond
  if (taskValueUsdc < 10000) return taskValueUsdc * 0.15;        // 15% bond
  return taskValueUsdc * 0.20;                                   // 20% bond (+ governance)
}

/**
 * Apply all scoring functions to raw agent data and return a fully computed Agent.
 * This is the single entry point — call this whenever input data changes.
 */
export function computeAgent(raw: AgentRawData): Agent {
  return {
    ...raw,
    reputationScore:   computeReputationScore(raw),
    availabilityScore: computeAvailabilityScore(raw),
    bondCollateral:    raw.lockedBond,   // bondCollateral IS the lockedBond (raw input)
    disputeRate:       computeDisputeRate(raw),
  };
}

/**
 * Compute a discovery ranking score used to sort agents in search results.
 * Formula: reputation × availability_fraction × price_competitiveness
 *
 * @param agent - Fully computed agent
 * @param maxBasePrice - Highest base price among all agents in the result set (for normalisation)
 * @returns Ranking score (higher = better match)
 */
export function computeDiscoveryRank(agent: Agent, maxBasePrice: number): number {
  const repNorm           = agent.reputationScore / MAX_REPUTATION;         // 0–1
  const availNorm         = agent.availabilityScore / 100;                  // 0–1
  // Price competitiveness: cheaper agents rank higher
  const priceCompetitive  = maxBasePrice > 0
    ? 1 - agent.pricingModel.basePrice / maxBasePrice
    : 1;
  return repNorm * availNorm * priceCompetitive;
}
