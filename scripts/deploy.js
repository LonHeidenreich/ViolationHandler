/**
 * Hardhat Deployment Script for Anonymous Violation Handler
 *
 * This script deploys the complete violation reporting system including:
 * - ViolationRegistry contract
 * - AnonymousViolationHandler main contract
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network sepolia
 *   npx hardhat run scripts/deploy.js --network localhost
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("Anonymous Violation Handler Deployment");
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
    // ============================================
    // Step 1: Deploy ViolationRegistry
    // ============================================
    console.log("📝 Step 1: Deploying ViolationRegistry...");
    const ViolationRegistry = await hre.ethers.getContractFactory("ViolationRegistry");
    const violationRegistry = await ViolationRegistry.deploy();
    await violationRegistry.waitForDeployment();
    const registryAddress = await violationRegistry.getAddress();

    console.log(`✅ ViolationRegistry deployed to: ${registryAddress}`);

    deploymentInfo.contracts.ViolationRegistry = {
      address: registryAddress,
      constructorArgs: []
    };

    // Wait for confirmations on public networks
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
      console.log("⏳ Waiting for 3 block confirmations...");
      await violationRegistry.deploymentTransaction().wait(3);
      console.log("✅ Confirmations received\n");
    } else {
      console.log();
    }

    // ============================================
    // Step 2: Deploy AnonymousViolationHandler
    // ============================================
    console.log("📝 Step 2: Deploying AnonymousViolationHandler...");
    const AnonymousViolationHandler = await hre.ethers.getContractFactory("AnonymousViolationHandler");
    const violationHandler = await AnonymousViolationHandler.deploy();
    await violationHandler.waitForDeployment();
    const handlerAddress = await violationHandler.getAddress();

    console.log(`✅ AnonymousViolationHandler deployed to: ${handlerAddress}`);

    deploymentInfo.contracts.AnonymousViolationHandler = {
      address: handlerAddress,
      constructorArgs: []
    };

    // Wait for confirmations on public networks
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
      console.log("⏳ Waiting for 3 block confirmations...");
      await violationHandler.deploymentTransaction().wait(3);
      console.log("✅ Confirmations received\n");
    } else {
      console.log();
    }

    // ============================================
    // Step 3: Initialize contracts
    // ============================================
    console.log("📝 Step 3: Verifying contract initialization...");

    const owner = await violationHandler.owner();
    const totalViolations = await violationHandler.getTotalViolations();
    const isPauser = await violationHandler.isPauser(deployerAddress);

    console.log(`✅ Contract Owner: ${owner}`);
    console.log(`✅ Total Violations: ${totalViolations}`);
    console.log(`✅ Deployer is Pauser: ${isPauser}`);
    console.log(`✅ Contract initialized successfully\n`);

    // ============================================
    // Step 4: Save deployment information
    // ============================================
    console.log("📝 Step 4: Saving deployment information...");

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

    // ============================================
    // Deployment Summary
    // ============================================
    console.log("========================================");
    console.log("🎉 Deployment Summary");
    console.log("========================================");
    console.log(`Network:                  ${hre.network.name}`);
    console.log(`Chain ID:                 ${network.chainId}`);
    console.log(`Deployer:                 ${deployerAddress}`);
    console.log(`ViolationRegistry:        ${registryAddress}`);
    console.log(`AnonymousViolationHandler: ${handlerAddress}`);
    console.log("========================================\n");

    // ============================================
    // Next Steps
    // ============================================
    console.log("📋 Next Steps:");
    console.log("1. Verify contracts on Etherscan:");
    console.log(`   npx hardhat run scripts/verify.js --network ${hre.network.name}`);
    console.log("\n2. Test contract interactions:");
    console.log(`   npx hardhat run scripts/interact.js --network ${hre.network.name}`);
    console.log("\n3. Run simulation:");
    console.log(`   npx hardhat run scripts/simulate.js --network ${hre.network.name}\n`);

    // Return deployment info for programmatic use
    return {
      violationRegistry: registryAddress,
      anonymousViolationHandler: handlerAddress,
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
