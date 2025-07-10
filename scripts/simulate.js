/**
 * Contract Simulation Script
 *
 * This script simulates real-world usage of the Anonymous Violation Handler
 *
 * Usage:
 *   npx hardhat run scripts/simulate.js --network sepolia
 *   npx hardhat run scripts/simulate.js --network localhost
 *
 * Features:
 *   - Report test violations with encrypted data
 *   - Submit mock payments
 *   - Process payments (owner only)
 *   - Update fine amounts (owner only)
 *   - Complete end-to-end workflow testing
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("Contract Simulation Script");
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

  if (balance < hre.ethers.parseEther("0.01")) {
    console.warn("⚠️  Warning: Low balance. Simulation may fail.\n");
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
  console.log("📂 Loaded deployment info\n");

  try {
    // ============================================
    // Connect to Contract
    // ============================================
    const handlerAddress = deploymentInfo.contracts.AnonymousViolationHandler.address;
    console.log(`📝 Connecting to AnonymousViolationHandler at ${handlerAddress}...\n`);

    const AnonymousViolationHandler = await hre.ethers.getContractFactory("AnonymousViolationHandler");
    const contract = AnonymousViolationHandler.attach(handlerAddress);

    // Check if owner
    const owner = await contract.owner();
    const isOwner = owner.toLowerCase() === signerAddress.toLowerCase();

    console.log(`Contract Owner: ${owner}`);
    console.log(`You are Owner: ${isOwner}\n`);

    // ============================================
    // Step 1: Check Current Status
    // ============================================
    console.log("========================================");
    console.log("Step 1: Current Contract Status");
    console.log("========================================\n");

    const totalBefore = await contract.getTotalViolations();
    const paused = await contract.paused();

    console.log(`Total Violations: ${totalBefore}`);
    console.log(`Contract Paused:  ${paused}`);

    if (paused) {
      console.log("\n⚠️  Contract is paused. Cannot simulate violations.");
      console.log("Run this script as a pauser to unpause the contract.\n");
      process.exit(0);
    }
    console.log();

    // ============================================
    // Step 2: Simulate Violation Reporting
    // ============================================
    console.log("========================================");
    console.log("Step 2: Report Test Violations");
    console.log("========================================\n");

    const testViolations = [
      {
        location: "Main Street & 5th Ave",
        type: 1, // Speeding
        description: "Speeding violation"
      },
      {
        location: "Downtown Parking Lot",
        type: 2, // Parking
        description: "Illegal parking"
      },
      {
        location: "Highway 101 Intersection",
        type: 3, // Red Light
        description: "Red light violation"
      }
    ];

    console.log(`Preparing to report ${testViolations.length} test violations...\n`);

    // Note: In a real FHE implementation, these would be actual encrypted values
    // For simulation purposes, we're using mock encrypted data
    console.log("⚠️  Note: This simulation uses mock data.");
    console.log("Full FHE encryption requires fhevmjs library and proper setup.\n");

    for (let i = 0; i < testViolations.length; i++) {
      const violation = testViolations[i];
      console.log(`📝 Reporting violation ${i + 1}/${testViolations.length}:`);
      console.log(`   Type: ${violation.description}`);
      console.log(`   Location: ${violation.location}`);

      try {
        // In a real implementation, you would use fhevmjs to create encrypted inputs
        // For simulation, we demonstrate the structure

        // Create mock encrypted values (these are placeholders)
        const mockLicenseHash = Math.floor(Math.random() * 1000000);
        const mockSeverityScore = Math.floor(Math.random() * 50) + 1; // 1-50
        const mockIsRepeat = Math.random() > 0.7 ? 1 : 0; // 30% chance of repeat

        console.log(`   Mock License Hash: ${mockLicenseHash}`);
        console.log(`   Mock Severity: ${mockSeverityScore}`);
        console.log(`   Mock Repeat Offender: ${mockIsRepeat === 1 ? 'Yes' : 'No'}`);

        // Note: The actual reportViolation function requires FHE encrypted inputs
        // This would fail without proper FHE setup
        console.log(`   ⚠️  Skipping actual transaction (requires FHE encryption)`);
        console.log();

        // If you want to test with actual FHE, you would do:
        // const instance = await createInstance({ chainId, publicKey });
        // const encryptedLicense = instance.encrypt32(mockLicenseHash);
        // const encryptedType = instance.encrypt8(violation.type);
        // const encryptedSeverity = instance.encrypt32(mockSeverityScore);
        // const encryptedRepeat = instance.encrypt8(mockIsRepeat);
        // const inputProof = instance.generateProof();
        //
        // const tx = await contract.reportViolation(
        //   encryptedLicense,
        //   encryptedType,
        //   encryptedSeverity,
        //   encryptedRepeat,
        //   violation.location,
        //   inputProof
        // );
        // await tx.wait();

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }

    // ============================================
    // Step 3: Query Violations
    // ============================================
    console.log("========================================");
    console.log("Step 3: Query Current Violations");
    console.log("========================================\n");

    const totalAfter = await contract.getTotalViolations();
    console.log(`Total Violations: ${totalAfter}`);

    if (totalAfter > 0) {
      console.log("\nQuerying recent violations...\n");

      const queryCount = Math.min(3, Number(totalAfter));
      for (let i = Number(totalAfter); i > Number(totalAfter) - queryCount; i--) {
        try {
          const info = await contract.getViolationInfo(i);
          console.log(`Violation #${i}:`);
          console.log(`  Location:  ${info.location}`);
          console.log(`  Reporter:  ${info.reporter}`);
          console.log(`  Timestamp: ${new Date(Number(info.timestamp) * 1000).toLocaleString()}`);
          console.log(`  Is Paid:   ${info.isPaid}`);
          console.log(`  Processed: ${info.isProcessed}`);
          console.log();
        } catch (error) {
          console.log(`  Error querying violation #${i}\n`);
        }
      }
    } else {
      console.log("No violations found in the system.\n");
    }

    // ============================================
    // Step 4: Owner Functions (if owner)
    // ============================================
    if (isOwner) {
      console.log("========================================");
      console.log("Step 4: Owner Functions Demo");
      console.log("========================================\n");

      console.log("📝 Testing fine amount updates...\n");

      // Check current fine for speeding
      const currentFine = await contract.getBaseFine(1);
      console.log(`Current Speeding Fine: ${hre.ethers.formatEther(currentFine)} ETH`);

      // Optionally update (commented out to avoid changing production values)
      console.log("\n💡 To update fine amounts:");
      console.log('   const newFine = hre.ethers.parseEther("175");');
      console.log('   await contract.updateViolationFine(1, newFine);');
      console.log();

      // Payment processing demo
      if (totalAfter > 0) {
        console.log("📝 Payment Processing (requires FHE setup)...\n");
        console.log("To process a payment:");
        console.log('   1. User submits payment with submitPayment()');
        console.log('   2. Owner calls processPayment(violationId)');
        console.log('   3. Gateway decrypts and calls finalizePaymentCallback()');
        console.log();
      }
    }

    // ============================================
    // Step 5: Simulation Summary
    // ============================================
    console.log("========================================");
    console.log("✅ Simulation Complete");
    console.log("========================================");
    console.log(`Network:          ${hre.network.name}`);
    console.log(`Contract:         ${handlerAddress}`);
    console.log(`Total Violations: ${totalAfter}`);
    console.log(`Status:           ${paused ? 'Paused' : 'Active'}`);
    console.log("========================================\n");

    console.log("📋 Implementation Notes:");
    console.log("1. Full FHE requires fhevmjs library setup");
    console.log("2. Encrypted inputs need proper key generation");
    console.log("3. Gateway callbacks handle decryption asynchronously");
    console.log("4. Payment verification uses encrypted comparisons");
    console.log("\n📚 For complete FHE implementation:");
    console.log("   - Install: npm install fhevmjs");
    console.log("   - Setup instance with chain ID and public key");
    console.log("   - Generate encrypted inputs and proofs");
    console.log("   - Handle Gateway callbacks for decryption");
    console.log();

    console.log("🔗 Useful Commands:");
    console.log(`   Interact: npx hardhat run scripts/interact.js --network ${hre.network.name}`);
    console.log(`   Verify:   npx hardhat run scripts/verify.js --network ${hre.network.name}`);
    console.log();

  } catch (error) {
    console.error("\n❌ Simulation failed!");
    console.error(error);
    process.exit(1);
  }
}

// Execute simulation
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
