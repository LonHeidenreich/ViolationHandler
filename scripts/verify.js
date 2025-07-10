/**
 * Hardhat Contract Verification Script
 *
 * This script verifies deployed contracts on Etherscan
 *
 * Usage:
 *   npx hardhat run scripts/verify.js --network sepolia
 *
 * Prerequisites:
 *   - Contracts must be deployed
 *   - ETHERSCAN_API_KEY must be set in .env
 *   - Deployment info must exist in deployments/ folder
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("Contract Verification on Etherscan");
  console.log("========================================\n");

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log(`📡 Network: ${hre.network.name}`);
  console.log(`📡 Chain ID: ${network.chainId}\n`);

  // Check if Etherscan API key is set
  if (!process.env.ETHERSCAN_API_KEY) {
    console.error("❌ Error: ETHERSCAN_API_KEY not set in .env file");
    console.log("Please add your Etherscan API key to .env file");
    process.exit(1);
  }

  // Load deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const latestFile = path.join(deploymentsDir, `${hre.network.name}-latest.json`);

  if (!fs.existsSync(latestFile)) {
    console.error(`❌ Error: No deployment found for ${hre.network.name}`);
    console.log(`Please run deployment first: npx hardhat run scripts/deploy.js --network ${hre.network.name}`);
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(latestFile, "utf8"));
  console.log("📂 Loaded deployment info from:", latestFile);
  console.log();

  try {
    // ============================================
    // Verify ViolationRegistry
    // ============================================
    if (deploymentInfo.contracts.ViolationRegistry) {
      console.log("📝 Step 1: Verifying ViolationRegistry...");
      const registryAddress = deploymentInfo.contracts.ViolationRegistry.address;
      const registryArgs = deploymentInfo.contracts.ViolationRegistry.constructorArgs || [];

      console.log(`   Address: ${registryAddress}`);
      console.log(`   Constructor args: ${JSON.stringify(registryArgs)}`);

      try {
        await hre.run("verify:verify", {
          address: registryAddress,
          constructorArguments: registryArgs,
        });
        console.log("✅ ViolationRegistry verified successfully\n");
      } catch (error) {
        if (error.message.includes("Already Verified")) {
          console.log("✅ ViolationRegistry already verified\n");
        } else {
          console.error("❌ ViolationRegistry verification failed:");
          console.error(error.message);
          console.log();
        }
      }
    }

    // ============================================
    // Verify AnonymousViolationHandler
    // ============================================
    if (deploymentInfo.contracts.AnonymousViolationHandler) {
      console.log("📝 Step 2: Verifying AnonymousViolationHandler...");
      const handlerAddress = deploymentInfo.contracts.AnonymousViolationHandler.address;
      const handlerArgs = deploymentInfo.contracts.AnonymousViolationHandler.constructorArgs || [];

      console.log(`   Address: ${handlerAddress}`);
      console.log(`   Constructor args: ${JSON.stringify(handlerArgs)}`);

      try {
        await hre.run("verify:verify", {
          address: handlerAddress,
          constructorArguments: handlerArgs,
        });
        console.log("✅ AnonymousViolationHandler verified successfully\n");
      } catch (error) {
        if (error.message.includes("Already Verified")) {
          console.log("✅ AnonymousViolationHandler already verified\n");
        } else {
          console.error("❌ AnonymousViolationHandler verification failed:");
          console.error(error.message);
          console.log();
        }
      }
    }

    // ============================================
    // Verification Summary
    // ============================================
    console.log("========================================");
    console.log("✅ Verification Complete");
    console.log("========================================");
    console.log(`Network: ${hre.network.name}`);
    console.log(`Chain ID: ${network.chainId}`);

    if (deploymentInfo.contracts.ViolationRegistry) {
      const registryAddress = deploymentInfo.contracts.ViolationRegistry.address;
      console.log(`\n📄 ViolationRegistry:`);
      console.log(`   ${registryAddress}`);
      console.log(`   https://sepolia.etherscan.io/address/${registryAddress}`);
    }

    if (deploymentInfo.contracts.AnonymousViolationHandler) {
      const handlerAddress = deploymentInfo.contracts.AnonymousViolationHandler.address;
      console.log(`\n📄 AnonymousViolationHandler:`);
      console.log(`   ${handlerAddress}`);
      console.log(`   https://sepolia.etherscan.io/address/${handlerAddress}`);
    }

    console.log("========================================\n");

    console.log("📋 Next Steps:");
    console.log("1. Test contract interactions:");
    console.log(`   npx hardhat run scripts/interact.js --network ${hre.network.name}`);
    console.log("\n2. Run simulation:");
    console.log(`   npx hardhat run scripts/simulate.js --network ${hre.network.name}\n`);

  } catch (error) {
    console.error("\n❌ Verification process failed!");
    console.error(error);
    process.exit(1);
  }
}

// Execute verification
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
