# Phase 6: Launch Preparation Checklist (RelayVault v2)

## 1. Security & Audits
- [ ] Complete formal verification on `VaultWallet.sol` split rounding edge cases.
- [ ] Complete full security audit by minimum 2 tier-1 firms (e.g., Trail of Bits, OpenZeppelin).
- [ ] Set up Immunefi Bug Bounty ($500k TVL milestone).
- [ ] Add `Pausable` overrides to `VaultWallet` and `TaskEscrow` in the event of an zero-day exploit.

## 2. Infrastructure Deployment
- [ ] Obtain Monad mainnet whitelisting (if applicable for contract deployment).
- [ ] Deploy primary `AgentRegistry` and save artifacts.
- [ ] Deploy `NegotiationEngine` and link to Registry.
- [ ] Deploy `TaskEscrow` and link to Negotiation.
- [ ] Deploy `DisputeResolver` and `ReputationBondManager`.
- [ ] Finalize contract role assignments (`owner.setRoles(escrow, disputeResolver)`).

## 3. TheGraph Node / Indexer Setup
- [ ] Deploy custom `Subsquid` or `TheGraph` subgraph indexing:
    - `AgentRegistered`
    - `FundsLocked`
    - `FundsReleased`
    - `DisputeOpened`
- [ ] Ensure capability search latency is < 100ms.

## 4. UI/UX Polishing & Analytics
- [ ] Hook up mainnet RPC URLs via Wagmi/Viem.
- [ ] Replace `mockData.ts` completely with live indexed data from the subgraph.
- [ ] Implement Vercel performance monitoring and analytics.

## 5. Community & Developer Onboarding
- [ ] Publish SDK on npm as `@relayvault/sdk`.
- [ ] Release API Documentation portal with usage examples for sub-agents.
- [ ] Publish capability tag classification standard (RelayVault Standard Taxonomy v1).
- [ ] Bootstrap initial "Whitelisted Arbitrator" committee for dispute resolutions.

## 6. Mainnet Go-Live Sequence
1. Deploy scripts run and verified.
2. Publish verified contract source code to Monad explorer.
3. Treasury Multi-sig configured as owner of all contracts.
4. Social announcement + docs release.
