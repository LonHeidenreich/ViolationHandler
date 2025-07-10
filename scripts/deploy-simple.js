/**
 * Simplified Deployment Script for SimpleViolationHandler
 *
 * Usage:
 *   npx hardhat run scripts/deploy-simple.js --network sepolia
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("SimpleViolationHandler Deployment");
  console.log("========================================\n");

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log(`📡 Network: ${hre.network.name}`);
  console.log(`📡 Chain ID: ${network.chainId}\n`);

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await hre.ethers.provider.getBalance(deployerAddress);

  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  // Check if balance is sufficient
  if (balance < hre.ethers.parseEther("0.01")) {
    console.warn("⚠️  Warning: Low balance. Deployment may fail.\n");
  }

  const deploymentInfo = {
    network: hre.network.name,
    chainId: network.chainId.toString(),
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
    contracts: {}
  };

  try {
    // Deploy SimpleViolationHandler
    console.log("📝 Deploying SimpleViolationHandler...");
    const SimpleViolationHandler = await hre.ethers.getContractFactory("SimpleViolationHandler");
    const contract = await SimpleViolationHandler.deploy();
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    console.log(`✅ SimpleViolationHandler deployed to: ${contractAddress}`);

    deploymentInfo.contracts.SimpleViolationHandler = {
      address: contractAddress,
      constructorArgs: []
    };

    // Wait for confirmations on public networks
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
      console.log("⏳ Waiting for 5 block confirmations...");
      await contract.deploymentTransaction().wait(5);
      console.log("✅ Confirmations received\n");
    } else {
      console.log();
    }

    // Verify contract initialization
    console.log("📝 Verifying contract initialization...");
    const owner = await contract.owner();
    const totalViolations = await contract.getTotalViolations();
    const isPauser = await contract.isPauser(deployerAddress);

    console.log(`✅ Contract Owner: ${owner}`);
    console.log(`✅ Total Violations: ${totalViolations}`);
    console.log(`✅ Deployer is Pauser: ${isPauser}`);
    console.log(`✅ Contract initialized successfully\n`);

    // Check fine structure
    console.log("📝 Violation Fine Structure:");
    for (let i = 1; i <= 5; i++) {
      const fine = await contract.getBaseFine(i);
      const types = ["Speeding", "Parking", "Red Light", "No Seatbelt", "Mobile Phone"];
      console.log(`   Type ${i} (${types[i-1]}): ${hre.ethers.formatEther(fine)} ETH`);
    }
    console.log();

    // Save deployment information
    console.log("📝 Saving deployment information...");
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(
      deploymentsDir,
      `${hre.network.name}-${Date.now()}.json`
    );

    fs.writeFileSync(
      deploymentFile,
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log(`✅ Deployment info saved to: ${deploymentFile}\n`);

    // Save latest deployment
    const latestFile = path.join(deploymentsDir, `${hre.network.name}-latest.json`);
    fs.writeFileSync(
      latestFile,
      JSON.stringify(deploymentInfo, null, 2)
    );

    // Deployment Summary
    console.log("========================================");
    console.log("🎉 Deployment Summary");
    console.log("========================================");
    console.log(`Network:         ${hre.network.name}`);
    console.log(`Chain ID:        ${network.chainId}`);
    console.log(`Deployer:        ${deployerAddress}`);
    console.log(`Contract:        ${contractAddress}`);
    console.log(`Etherscan:       https://sepolia.etherscan.io/address/${contractAddress}`);
    console.log("========================================\n");

    // Next Steps
    console.log("📋 Next Steps:");
    console.log("1. Verify contract on Etherscan:");
    console.log(`   npx hardhat verify --network ${hre.network.name} ${contractAddress}`);
    console.log("\n2. Test contract interactions:");
    console.log(`   npx hardhat run scripts/interact.js --network ${hre.network.name}`);
    console.log("\n3. Update frontend with contract address:");
    console.log(`   Contract Address: ${contractAddress}\n`);

    return {
      contractAddress: contractAddress,
      deployer: deployerAddress
    };

  } catch (error) {
    console.error("\n❌ Deployment failed!");
    console.error(error);
    process.exit(1);
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
