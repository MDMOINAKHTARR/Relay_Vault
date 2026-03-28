const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying RelayVault protocol with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // 1. Deploy AgentRegistry
  console.log("\n[1/5] Deploying AgentRegistry...");
  const Registry = await ethers.getContractFactory("AgentRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ AgentRegistry deployed to:", registryAddress);

  // 2. Deploy NegotiationEngine
  console.log("\n[2/5] Deploying NegotiationEngine...");
  const Negotiation = await ethers.getContractFactory("NegotiationEngine");
  const negotiation = await Negotiation.deploy(registryAddress);
  await negotiation.waitForDeployment();
  const negotiationAddress = await negotiation.getAddress();
  console.log("✅ NegotiationEngine deployed to:", negotiationAddress);

  // 3. Deploy TaskEscrow
  console.log("\n[3/5] Deploying TaskEscrow...");
  const Escrow = await ethers.getContractFactory("TaskEscrow");
  const escrow = await Escrow.deploy(registryAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("✅ TaskEscrow deployed to:", escrowAddress);

  // 4. Deploy DisputeResolver
  console.log("\n[4/5] Deploying DisputeResolver...");
  const Resolver = await ethers.getContractFactory("DisputeResolver");
  const resolver = await Resolver.deploy(registryAddress);
  await resolver.waitForDeployment();
  const resolverAddress = await resolver.getAddress();
  console.log("✅ DisputeResolver deployed to:", resolverAddress);

  // 5. Deploy ReputationBondManager
  console.log("\n[5/5] Deploying ReputationBondManager...");
  const BondManager = await ethers.getContractFactory("ReputationBondManager");
  const bondManager = await BondManager.deploy(registryAddress);
  await bondManager.waitForDeployment();
  const bondManagerAddress = await bondManager.getAddress();
  console.log("✅ ReputationBondManager deployed to:", bondManagerAddress);

  // 6. Wire contracts together
  console.log("\n[WIRING] Linking contracts...");
  await registry.setRoles(escrowAddress, resolverAddress);
  await negotiation.setTaskEscrow(escrowAddress);
  await escrow.setEngines(negotiationAddress, resolverAddress, deployer.address);
  await resolver.setTaskEscrow(escrowAddress);
  await bondManager.setDisputeResolver(resolverAddress);
  console.log("✅ All roles and links set.");

  // 7. Auto-write addresses to .env.local
  const envPath = path.join(__dirname, "..", ".env.local");
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";

  const replacements = {
    NEXT_PUBLIC_REGISTRY_ADDRESS: registryAddress,
    NEXT_PUBLIC_NEGOTIATION_ADDRESS: negotiationAddress,
    NEXT_PUBLIC_ESCROW_ADDRESS: escrowAddress,
  };

  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, envContent);
  console.log("\n✅ Contract addresses written to .env.local");

  // 8. Print summary
  console.log("\n========== DEPLOYMENT SUMMARY ==========");
  console.log("REGISTRY:    ", registryAddress);
  console.log("NEGOTIATION: ", negotiationAddress);
  console.log("ESCROW:      ", escrowAddress);
  console.log("RESOLVER:    ", resolverAddress);
  console.log("BOND_MGR:    ", bondManagerAddress);
  console.log("=========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
