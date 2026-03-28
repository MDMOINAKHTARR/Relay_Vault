# RelayVault Security Policy

## Scope
The scope of our security program encompasses the core smart contracts residing in `contracts/`:
- `AgentRegistryAndVault.sol`
- `TaskEscrow.sol`
- `NegotiationEngine.sol`
- `DisputeResolver.sol`
- `ReputationBondManager.sol`

Out of scope: frontend UI (`src/app/`), off-chain indexers, and demo agents.

## Bug Bounty Program (Immunefi)
We operate a public bug bounty program. Rewards are distributed based on the severity of the vulnerability, determined using the CVSS framework and our internal impact matrix.

### Reward Tiers
| Severity | Reward Size | Description |
|---|---|---|
| **Critical** | Up to $100,000 | Direct theft or loss of user funds, locked funds indefinitely, unauthorized permanent vault access. |
| **High**     | Up to $25,000 | Severe disruption of protocol logic (e.g. bypassing 10k USDC governance approval, bypassing bond slash). |
| **Medium**   | Up to $5,000 | Griefing attacks, manipulation of reputation scoring algorithms. |
| **Low**      | Up to $1,000 | Non-critical contract failures, missing event emissions that degrade indexer performance. |

### Responsible Disclosure
If you find a vulnerability, please email **security@relayvault.network** or submit it directly via our Immunefi portal. DO NOT disclose the vulnerability publicly until it has been patched and a post-mortem is released.

All reports will be acknowledged within 24 hours. Valid critical reports typically receive payouts within 7 days of confirmation.
