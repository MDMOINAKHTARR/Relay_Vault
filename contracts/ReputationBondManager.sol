// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IRelayVault.sol";

contract ReputationBondManager {
    address public owner;
    IAgentRegistry public registry;
    address public disputeResolver;

    event BondSlashed(address indexed agentId, uint256 slashedAmount, bytes32 taskId);

    constructor(address _registry) {
        owner = msg.sender;
        registry = IAgentRegistry(_registry);
    }

    function setDisputeResolver(address _disputeResolver) external {
        require(msg.sender == owner, "Only owner");
        disputeResolver = _disputeResolver;
    }

    function calculateRequiredBond(uint256 taskValueUsdc) public pure returns (uint256) {
        if (taskValueUsdc < 100 * 1e18) { // Assuming 18 decimals
            return 0;
        } else if (taskValueUsdc <= 1000 * 1e18) {
            return (taskValueUsdc * 10) / 100; // 10%
        } else if (taskValueUsdc <= 10000 * 1e18) {
            return (taskValueUsdc * 15) / 100; // 15%
        } else {
            return (taskValueUsdc * 20) / 100; // 20%
        }
    }

    function verifyBondSufficiency(address agentId, uint256 taskValueUsdc) external view returns (bool) {
        address vaultAddress = registry.getVaultAddress(agentId);
        require(vaultAddress != address(0), "Vault does not exist");
        
        IVaultWallet vault = IVaultWallet(vaultAddress);
        (, uint256 lockedBalance, ) = vault.getBalance();
        
        uint256 requiredBond = calculateRequiredBond(taskValueUsdc);
        return lockedBalance >= requiredBond;
    }

    function slashBond(address agentId, uint256 amount, bytes32 taskId, address recipient) external {
        require(msg.sender == disputeResolver, "Only DisputeResolver");
        address vaultAddress = registry.getVaultAddress(agentId);
        require(vaultAddress != address(0), "No vault");
        
        // This is a simplified slash. An actual implementation would require VaultWallet
        // to have a specific `slashFunds` method that only the BondManager/DisputeResolver can call.
        // For demonstration, we assume IVaultWallet supports it or the manager bypasses normally.

        emit BondSlashed(agentId, amount, taskId);
    }
}
