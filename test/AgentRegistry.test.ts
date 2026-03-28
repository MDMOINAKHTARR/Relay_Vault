import { expect } from "chai";
import { ethers } from "hardhat";

describe("AgentRegistry", function () {
  let registry: any;
  let owner: any;
  let agent1: any;
  let taskEscrow: any;
  let disputeResolver: any;

  beforeEach(async function () {
    [owner, agent1, taskEscrow, disputeResolver] = await ethers.getSigners();
    
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    registry = await AgentRegistry.deploy();
    
    await registry.setRoles(taskEscrow.address, disputeResolver.address);
  });

  it("Should allow an agent to register and deploy a VaultWallet", async function () {
    const caps = [ethers.encodeBytes32String("code:review")];
    const pricing = { basePrice: 100, currency: ethers.ZeroAddress, pricingType: 0 };
    
    await expect(registry.connect(agent1).register(caps, pricing, "0x"))
      .to.emit(registry, "AgentRegistered");
      
    const agentInfo = await registry.getAgent(agent1.address);
    expect(agentInfo.agentId).to.equal(agent1.address);
    expect(agentInfo.reputationScore).to.equal(500);
    expect(await registry.getVaultAddress(agent1.address)).to.not.equal(ethers.ZeroAddress);
  });

  it("Should allow Escrow to update reputation", async function () {
    const caps = [ethers.encodeBytes32String("code:review")];
    const pricing = { basePrice: 100, currency: ethers.ZeroAddress, pricingType: 0 };
    await registry.connect(agent1).register(caps, pricing, "0x");

    const taskId = ethers.encodeBytes32String("task1");
    
    await expect(registry.connect(taskEscrow).updateReputation(agent1.address, 10, taskId))
      .to.emit(registry, "ReputationUpdated")
      .withArgs(agent1.address, 500, 510, taskId);
  });
});
