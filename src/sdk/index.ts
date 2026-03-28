import { ethers } from 'ethers';

export interface AgentPricingModel {
    basePrice: number;
    currency: string;
    pricingType: 0 | 1 | 2; // FIXED | AUCTION | DYNAMIC
}

export interface SplitRecipient {
    recipient: string;
    bps: number;
}

export class RelayVaultSDK {
    public provider: ethers.Provider;
    public signer?: ethers.Signer;
    public registryAddress: string;
    public escrowAddress: string;
    public negotiationAddress: string;

    constructor(
        provider: ethers.Provider, 
        registryAddress: string, 
        escrowAddress: string, 
        negotiationAddress: string,
        signer?: ethers.Signer
    ) {
        this.provider = provider;
        this.registryAddress = registryAddress;
        this.escrowAddress = escrowAddress;
        this.negotiationAddress = negotiationAddress;
        this.signer = signer;
    }

    /**
     * Connects a new signer to the SDK
     */
    connect(signer: ethers.Signer): RelayVaultSDK {
        return new RelayVaultSDK(
            this.provider, 
            this.registryAddress, 
            this.escrowAddress, 
            this.negotiationAddress,
            signer
        );
    }

    /**
     * Registers a new agent in the AgentRegistry.
     * Deploys a VaultWallet automatically on-chain.
     */
    async registerAgent(capabilities: string[], pricing: AgentPricingModel, routingConfigHex: string = "0x"): Promise<ethers.TransactionResponse> {
        if (!this.signer) throw new Error("Signer not connected");
        
        // Minimal ABI for registry calls
        const registryAbi = ["function register(bytes32[],(uint256,address,uint8),bytes) external"];
        const contract = new ethers.Contract(this.registryAddress, registryAbi, this.signer);
        
        const capsBytes32 = capabilities.map(c => ethers.encodeBytes32String(c));
        const pricingTuple = [pricing.basePrice, pricing.currency, pricing.pricingType];

        return await contract.register(capsBytes32, pricingTuple, routingConfigHex);
    }

    /**
     * Configure VaultWallet split routing.
     */
    async setVaultRouting(vaultAddress: string, splits: SplitRecipient[], lockBps: number, holdBps: number): Promise<ethers.TransactionResponse> {
        if (!this.signer) throw new Error("Signer not connected");

        const vaultAbi = ["function setRouting((address,uint16)[],uint16,uint16) external"];
        const contract = new ethers.Contract(vaultAddress, vaultAbi, this.signer);

        const splitTuple = splits.map(s => [s.recipient, s.bps]);
        return await contract.setRouting(splitTuple, lockBps, holdBps);
    }

    /**
     * Submits a fresh Negotiation Bid to another agent.
     */
    async submitBid(taskSpecCID: string, targetAgent: string, price: number, ttlBlocks: number = 100): Promise<ethers.TransactionResponse> {
        if (!this.signer) throw new Error("Signer not connected");

        const negoAbi = ["function submitBid(string,address,uint256,uint256) external returns(bytes32)"];
        const contract = new ethers.Contract(this.negotiationAddress, negoAbi, this.signer);

        return await contract.submitBid(taskSpecCID, targetAgent, price, ttlBlocks);
    }

    /**
     * Automatically accept a bid and lock funds in Escrow.
     */
    async acceptBidAndLock(bidId: string): Promise<ethers.TransactionResponse> {
        if (!this.signer) throw new Error("Signer not connected");

        const negoAbi = ["function acceptBid(bytes32) external"];
        const contract = new ethers.Contract(this.negotiationAddress, negoAbi, this.signer);

        return await contract.acceptBid(bidId);
    }

    /**
     * Resolves an execution dispute (Arbitrator role only).
     */
    async resolveDispute(escrowId: string, resolution: 1 | 2 | 3): Promise<ethers.TransactionResponse> {
        if (!this.signer) throw new Error("Signer not connected");

        const escrowAbi = ["function resolveDispute(bytes32,uint8) external"];
        const contract = new ethers.Contract(this.escrowAddress, escrowAbi, this.signer);

        return await contract.resolveDispute(escrowId, resolution);
    }
}
