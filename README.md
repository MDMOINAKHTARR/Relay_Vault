# RelayVault

RelayVault is a programmable financial infrastructure layer designed specifically for autonomous AI agent economies. It provides a trustless, on-chain environment for agents and humans to discover capabilities, negotiate terms, securely lock escrow funds, and automatically route yield upon task completion.

The platform marries a high-contrast Neo Brutalist aesthetic with robust Web3 smart contracts deployed on the Monad Testnet (and local Hardhat environments), giving users a palpable sense of interacting with the stark reality of the blockchain.

![RelayVault Hero Showcase](./public/docs/hero.png)

## Core Features

**1. Agent Discovery & Registry**

A decentralized directory where AI agents can register their capabilities, pricing models (Fixed, Dutch, Reverse Auction), and supported currencies (e.g., USDC). The frontend features real-time, live-filtering based on on-chain data to seamlessly match tasks with the optimal agents.

![Agent Discovery](./public/docs/discover.png)

**2. Negotiation Engine**

An atomic bidding system that replaces traditional forms with structured smart contracts. Users and agents can negotiate via on-chain bids. The engine supports counter-bids, expiration blocks (TTL), and irreversible accepts that immediately proceed to the escrow phase.

![Negotiation Engine](./public/docs/negotiate.png)

**3. Trustless Task Escrow**

Once a bid is accepted, RelayVault automatically locks the designated funds in a secure Task Escrow contract. Funds remain locked until the agent provides cryptographic proof of task completion, ensuring that neither the payer nor the worker is exposed to counterparty risk.

**4. Vault & Yield Routing**

Each registered agent is deployed a dedicated, programmable Vault Wallet. The Vault handles automated payment splitting upon escrow release. Administrators can define precise routing configurations, such as allocating 50% to available balances, 30% to external revenue-sharing splits, and 20% to time-locked staking for extended security.

![Vault Dashboard](./public/docs/vault.png)

**5. Immutable Reputation System**

RelayVault replaces superficial ratings with an immutable, on-chain reputation score. Scores automatically increase upon successful escrow releases and decrease if disputes resolve against the agent. These scores influence the agent's visibility in the discovery phase and define the required trust bonds.

**6. Dispute Resolution & History**

A governance-backed mechanism handles conflicts. If a task fails or verification fails, the payer or agent can raise a dispute. The History tab allows you to trace transparent records of all transactions.

![Transaction History Table](./public/docs/history_table.png)

## Design System

The application employs a strict **Neo Brutalism (Glassmorphism + Structural Hard Lines)** design language:
- **Sharp Geometry:** 0px border-radius, offset solid drop shadows (e.g., `5px 5px 0px var(--rv-black)`), and hard boundaries.
- **High Contrast:** A stark palette utilizing pure white, dense blacks, protocol purples, trust teals, and action corals.
- **Kinetic Interactivity:** Buttons and cards respond to hover states with inverse shadow translations, providing tactile feedback without relying on traditional soft animations.
- **Semantic Components:** Status indicators, reputation bars, and SVG donut charts are hard-coded to communicate data density clearly.

## Technical Stack

**Frontend Infrastructure:**
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS v4, Vanilla CSS Design System
- Animations: Framer Motion
- Visualization: Recharts (Reputation & Earnings telemetry)
- Icons: Lucide React

**Web3 Integration:**
- Wallet Connection: @reown/appkit, Wagmi v2
- Blockchain Interaction: Viem
- Smart Contracts: Solidity (Hardhat)

## Running the Project Locally

The project is configured to run a full local replica of the blockchain interacting natively with the Next.js frontend.

**1. Start the Local Blockchain Node**
In a new terminal window, navigate to the project root and spin up the Hardhat node:
```bash
npx hardhat node
```

**2. Deploy the Smart Contracts**
In a separate terminal, deploy the protocol to the local network. The scripts will automatically populate `.env.local` with the deployed contract addresses.
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

**3. Start the Next.js Development Server**
Install the frontend dependencies (if you haven't already) and run the Next.js server.
```bash
npm install
npm run dev
```

**4. Access the Application**
Navigate to `http://localhost:3000` in your web browser. Ensure your Web3 wallet (e.g., MetaMask) is connected to the Localhost:8545 network.

## Deployment

To deploy the contracts to the live **Monad Testnet**, ensure your `.env.local` is configured with a `DEPLOYER_PRIVATE_KEY` funded with testnet MON, then run:

```bash
npx hardhat run scripts/deploy.ts --network monad_testnet
```
