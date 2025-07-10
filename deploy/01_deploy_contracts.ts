import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deployment script for Anonymous Violation Handler system
 * Deploys both ViolationRegistry and AnonymousViolationHandler contracts
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("----------------------------------------------------");
  log("Deploying ViolationRegistry...");

  // Deploy ViolationRegistry first
  const violationRegistry = await deploy("ViolationRegistry", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  log(`ViolationRegistry deployed at: ${violationRegistry.address}`);
  log("----------------------------------------------------");
  log("Deploying AnonymousViolationHandler...");

  // Deploy main contract
  const violationHandler = await deploy("AnonymousViolationHandler", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  log(`AnonymousViolationHandler deployed at: ${violationHandler.address}`);
  log("----------------------------------------------------");

  // Verify contracts on Etherscan if on a public network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localfhevm") {
    log("Waiting for block confirmations...");
    await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds

    try {
      log("Verifying ViolationRegistry...");
      await hre.run("verify:verify", {
        address: violationRegistry.address,
        constructorArguments: [],
      });
      log("ViolationRegistry verified!");

      log("Verifying AnonymousViolationHandler...");
      await hre.run("verify:verify", {
        address: violationHandler.address,
        constructorArguments: [],
      });
      log("AnonymousViolationHandler verified!");
    } catch (error: any) {
      if (error.message.includes("already verified")) {
        log("Contracts already verified!");
      } else {
        log("Error verifying contracts:", error);
      }
    }
  }

  log("----------------------------------------------------");
  log("Deployment Summary:");
  log(`ViolationRegistry: ${violationRegistry.address}`);
  log(`AnonymousViolationHandler: ${violationHandler.address}`);
  log(`Deployer: ${deployer}`);
  log("----------------------------------------------------");
};

export default func;
func.tags = ["all", "violation-system"];
