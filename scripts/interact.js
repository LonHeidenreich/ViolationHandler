/**
 * Contract Interaction Script
 *
 * This script provides interactive testing of deployed contracts
 *
 * Usage:
 *   npx hardhat run scripts/interact.js --network sepolia
 *   npx hardhat run scripts/interact.js --network localhost
 *
 * Features:
 *   - Check contract status
 *   - Query violation information
 *   - Test basic contract functions
 *   - View owner and pauser information
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("Contract Interaction Script");
  console.log("========================================\n");

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log(`📡 Network: ${hre.network.name}`);
  console.log(`📡 Chain ID: ${network.chainId}\n`);

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  const signerAddress = await signer.getAddress();
  const balance = await hre.ethers.provider.getBalance(signerAddress);

  console.log(`👤 Signer: ${signerAddress}`);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  // Load deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const latestFile = path.join(deploymentsDir, `${hre.network.name}-latest.json`);

  if (!fs.existsSync(latestFile)) {
    console.error(`❌ Error: No deployment found for ${hre.network.name}`);
    console.log(`Please run deployment first: npx hardhat run scripts/deploy.js --network ${hre.network.name}`);
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(latestFile, "utf8"));
  console.log("📂 Loaded deployment info");

  try {
    // ============================================
    // Connect to AnonymousViolationHandler
    // ============================================
    const handlerAddress = deploymentInfo.contracts.AnonymousViolationHandler.address;
    console.log(`\n📝 Connecting to AnonymousViolationHandler at ${handlerAddress}...\n`);

    const AnonymousViolationHandler = await hre.ethers.getContractFactory("AnonymousViolationHandler");
    const contract = AnonymousViolationHandler.attach(handlerAddress);

    // ============================================
    // Step 1: Check Contract Status
    // ============================================
    console.log("========================================");
    console.log("Step 1: Contract Status");
    console.log("========================================\n");

    const owner = await contract.owner();
    const totalViolations = await contract.getTotalViolations();
    const paused = await contract.paused();
    const pauserCount = await contract.pauserCount();
    const isPauser = await contract.isPauser(signerAddress);

    console.log(`Owner:            ${owner}`);
    console.log(`Total Violations: ${totalViolations}`);
    console.log(`Contract Paused:  ${paused}`);
    console.log(`Pauser Count:     ${pauserCount}`);
    console.log(`You are Pauser:   ${isPauser}`);
    console.log();

    // ============================================
    // Step 2: Check Violation Fine Structure
    // ============================================
    console.log("========================================");
    console.log("Step 2: Violation Fine Structure");
    console.log("========================================\n");

    const violationTypes = [
      { id: 1, name: "Speeding" },
      { id: 2, name: "Illegal Parking" },
      { id: 3, name: "Red Light" },
      { id: 4, name: "No Seatbelt" },
      { id: 5, name: "Mobile Phone" }
    ];

    for (const type of violationTypes) {
      try {
        const fine = await contract.getBaseFine(type.id);
        console.log(`${type.name} (Type ${type.id}): ${hre.ethers.formatEther(fine)} ETH`);
      } catch (error) {
        console.log(`${type.name} (Type ${type.id}): Error reading fine`);
      }
    }
    console.log();

    // ============================================
    // Step 3: Query Violations (if any)
    // ============================================
    console.log("========================================");
    console.log("Step 3: Query Violations");
    console.log("========================================\n");

    const total = Number(totalViolations);

    if (total === 0) {
      console.log("No violations reported yet.");
      console.log("Use the simulate.js script to create test violations.\n");
    } else {
      console.log(`Found ${total} violation(s). Querying details...\n`);

      // Query up to 5 most recent violations
      const queryCount = Math.min(5, total);
      for (let i = total; i > total - queryCount; i--) {
        try {
          const info = await contract.getViolationInfo(i);
          const paymentStatus = await contract.getPaymentStatus(i);

          console.log(`Violation #${i}:`);
          console.log(`  Location:    ${info.location}`);
          console.log(`  Timestamp:   ${new Date(Number(info.timestamp) * 1000).toLocaleString()}`);
          console.log(`  Reporter:    ${info.reporter}`);
          console.log(`  Is Paid:     ${info.isPaid}`);
          console.log(`  Is Processed: ${info.isProcessed}`);
          console.log(`  Payment Time: ${paymentStatus.timestamp > 0 ? new Date(Number(paymentStatus.timestamp) * 1000).toLocaleString() : 'N/A'}`);
          console.log(`  Verified:    ${paymentStatus.verified}`);
          console.log();
        } catch (error) {
          console.log(`  Error querying violation #${i}: ${error.message}\n`);
        }
      }
    }

    // ============================================
    // Step 4: Check Your Violations
    // ============================================
    console.log("========================================");
    console.log("Step 4: Your Reported Violations");
    console.log("========================================\n");

    try {
      const yourViolations = await contract.getReporterViolations(signerAddress);

      if (yourViolations.length === 0) {
        console.log("You have not reported any violations yet.\n");
      } else {
        console.log(`You have reported ${yourViolations.length} violation(s):`);
        console.log(yourViolations.map(v => `#${v}`).join(", "));
        console.log();
      }
    } catch (error) {
      console.log(`Error querying your violations: ${error.message}\n`);
    }

    // ============================================
    // Step 5: ViolationRegistry (if deployed)
    // ============================================
    if (deploymentInfo.contracts.ViolationRegistry) {
      console.log("========================================");
      console.log("Step 5: ViolationRegistry Status");
      console.log("========================================\n");

      const registryAddress = deploymentInfo.contracts.ViolationRegistry.address;
      console.log(`Registry Address: ${registryAddress}`);

      try {
        const ViolationRegistry = await hre.ethers.getContractFactory("ViolationRegistry");
        const registry = ViolationRegistry.attach(registryAddress);

        // Check if registry has owner function
        const registryOwner = await registry.owner();
        console.log(`Registry Owner:   ${registryOwner}`);
        console.log();
      } catch (error) {
        console.log("Registry status check not available\n");
      }
    }

    // ============================================
    // Interaction Summary
    // ============================================
    console.log("========================================");
    console.log("✅ Interaction Complete");
    console.log("========================================");
    console.log(`Network:  ${hre.network.name}`);
    console.log(`Contract: ${handlerAddress}`);
    console.log(`Status:   ${paused ? 'Paused' : 'Active'}`);
    console.log(`Total Violations: ${totalViolations}`);
    console.log("========================================\n");

    console.log("📋 Available Actions:");
    console.log("1. Run simulation to test violation reporting:");
    console.log(`   npx hardhat run scripts/simulate.js --network ${hre.network.name}`);
    console.log("\n2. Update fine amounts (owner only):");
    console.log(`   await contract.updateViolationFine(1, ethers.parseEther("200"))`);
    console.log("\n3. Query specific violation:");
    console.log(`   await contract.getViolationInfo(violationId)`);
    console.log();

  } catch (error) {
    console.error("\n❌ Interaction failed!");
    console.error(error);
    process.exit(1);
  }
}

// Execute interaction
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
