import { expect } from "chai";
import { ethers } from "hardhat";
import { AnonymousViolationHandler, ViolationRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Comprehensive test suite for Anonymous Violation Handler
 * Tests FHE operations, access control, and edge cases
 */
describe("AnonymousViolationHandler", function () {
  let violationHandler: AnonymousViolationHandler;
  let violationRegistry: ViolationRegistry;
  let owner: SignerWithAddress;
  let pauser: SignerWithAddress;
  let reporter: SignerWithAddress;
  let violator: SignerWithAddress;

  beforeEach(async function () {
    [owner, pauser, reporter, violator] = await ethers.getSigners();

    // Deploy ViolationRegistry
    const ViolationRegistryFactory = await ethers.getContractFactory("ViolationRegistry");
    violationRegistry = await ViolationRegistryFactory.deploy();
    await violationRegistry.waitForDeployment();

    // Deploy AnonymousViolationHandler
    const ViolationHandlerFactory = await ethers.getContractFactory("AnonymousViolationHandler");
    violationHandler = await ViolationHandlerFactory.deploy();
    await violationHandler.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await violationHandler.owner()).to.equal(owner.address);
    });

    it("Should initialize owner as pauser", async function () {
      expect(await violationHandler.isPauser(owner.address)).to.be.true;
      expect(await violationHandler.pauserCount()).to.equal(1);
    });

    it("Should initialize violation counter to zero", async function () {
      expect(await violationHandler.getTotalViolations()).to.equal(0);
    });

    it("Should not be paused initially", async function () {
      expect(await violationHandler.paused()).to.be.false;
    });
  });

  describe("PauserSet Mechanism", function () {
    it("Should allow owner to add pausers", async function () {
      await expect(violationHandler.addPauser(pauser.address))
        .to.emit(violationHandler, "PauserAdded")
        .withArgs(pauser.address);

      expect(await violationHandler.isPauser(pauser.address)).to.be.true;
      expect(await violationHandler.pauserCount()).to.equal(2);
    });

    it("Should revert when adding existing pauser", async function () {
      await violationHandler.addPauser(pauser.address);
      await expect(violationHandler.addPauser(pauser.address))
        .to.be.revertedWithCustomError(violationHandler, "AlreadyPauser");
    });

    it("Should allow owner to remove pausers", async function () {
      await violationHandler.addPauser(pauser.address);

      await expect(violationHandler.removePauser(pauser.address))
        .to.emit(violationHandler, "PauserRemoved")
        .withArgs(pauser.address);

      expect(await violationHandler.isPauser(pauser.address)).to.be.false;
      expect(await violationHandler.pauserCount()).to.equal(1);
    });

    it("Should revert when removing non-pauser", async function () {
      await expect(violationHandler.removePauser(pauser.address))
        .to.be.revertedWithCustomError(violationHandler, "NotAPauser");
    });

    it("Should allow pausers to toggle pause", async function () {
      await violationHandler.addPauser(pauser.address);

      await violationHandler.connect(pauser).togglePause();
      expect(await violationHandler.paused()).to.be.true;

      await violationHandler.connect(pauser).togglePause();
      expect(await violationHandler.paused()).to.be.false;
    });

    it("Should revert when non-pauser tries to toggle pause", async function () {
      await expect(violationHandler.connect(reporter).togglePause())
        .to.be.revertedWithCustomError(violationHandler, "NotAPauser");
    });
  });

  describe("Access Control", function () {
    it("Should prevent non-owner from adding pausers", async function () {
      await expect(violationHandler.connect(reporter).addPauser(pauser.address))
        .to.be.revertedWithCustomError(violationHandler, "Unauthorized");
    });

    it("Should prevent non-owner from updating fines", async function () {
      await expect(violationHandler.connect(reporter).updateViolationFine(1, ethers.parseEther("200")))
        .to.be.revertedWithCustomError(violationHandler, "Unauthorized");
    });

    it("Should allow owner to update fines", async function () {
      const newAmount = ethers.parseEther("200");
      await expect(violationHandler.updateViolationFine(1, newAmount))
        .to.emit(violationHandler, "FineAmountUpdated")
        .withArgs(1, newAmount);

      expect(await violationHandler.getBaseFine(1)).to.equal(newAmount);
    });
  });

  describe("Violation Fine Management", function () {
    it("Should revert for invalid violation type", async function () {
      await expect(violationHandler.getBaseFine(0))
        .to.be.revertedWithCustomError(violationHandler, "InvalidViolationType");

      await expect(violationHandler.getBaseFine(6))
        .to.be.revertedWithCustomError(violationHandler, "InvalidViolationType");
    });

    it("Should revert when setting zero fine amount", async function () {
      await expect(violationHandler.updateViolationFine(1, 0))
        .to.be.revertedWithCustomError(violationHandler, "AmountMustBePositive");
    });

    it("Should return correct base fines", async function () {
      expect(await violationHandler.getBaseFine(1)).to.equal(ethers.parseEther("150"));
      expect(await violationHandler.getBaseFine(2)).to.equal(ethers.parseEther("50"));
      expect(await violationHandler.getBaseFine(3)).to.equal(ethers.parseEther("200"));
      expect(await violationHandler.getBaseFine(4)).to.equal(ethers.parseEther("100"));
      expect(await violationHandler.getBaseFine(5)).to.equal(ethers.parseEther("120"));
    });
  });

  describe("Pause Functionality", function () {
    beforeEach(async function () {
      await violationHandler.togglePause();
    });

    it("Should prevent operations when paused", async function () {
      // Note: reportViolation requires FHE inputs which we can't easily mock
      // In production, use fhevmjs to create proper encrypted inputs

      await expect(violationHandler.updateViolationFine(1, ethers.parseEther("200")))
        .to.be.revertedWithCustomError(violationHandler, "ContractPaused");
    });

    it("Should allow operations after unpause", async function () {
      await violationHandler.togglePause(); // Unpause

      const newAmount = ethers.parseEther("200");
      await expect(violationHandler.updateViolationFine(1, newAmount))
        .to.emit(violationHandler, "FineAmountUpdated");
    });
  });

  describe("View Functions", function () {
    it("Should return total violations", async function () {
      expect(await violationHandler.getTotalViolations()).to.equal(0);
    });

    it("Should return empty array for reporter with no violations", async function () {
      const violations = await violationHandler.getReporterViolations(reporter.address);
      expect(violations.length).to.equal(0);
    });

    it("Should check license access correctly", async function () {
      // Without violations, this will revert with InvalidViolationId
      await expect(violationHandler.hasLicenseAccess(1))
        .to.be.revertedWithCustomError(violationHandler, "InvalidViolationId");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle invalid violation ID gracefully", async function () {
      await expect(violationHandler.getViolationInfo(0))
        .to.be.revertedWithCustomError(violationHandler, "InvalidViolationId");

      await expect(violationHandler.getViolationInfo(999))
        .to.be.revertedWithCustomError(violationHandler, "InvalidViolationId");
    });

    it("Should handle payment status for non-existent violation", async function () {
      await expect(violationHandler.getPaymentStatus(0))
        .to.be.revertedWithCustomError(violationHandler, "InvalidViolationId");
    });
  });
});

describe("ViolationRegistry", function () {
  let violationRegistry: ViolationRegistry;
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;

  beforeEach(async function () {
    [owner, nonOwner] = await ethers.getSigners();

    const ViolationRegistryFactory = await ethers.getContractFactory("ViolationRegistry");
    violationRegistry = await ViolationRegistryFactory.deploy();
    await violationRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should initialize with default violation types", async function () {
      const activeTypes = await violationRegistry.getActiveTypes();
      expect(activeTypes.length).to.equal(5);
    });

    it("Should have correct default type information", async function () {
      const [name, description, baseFine, totalCount] = await violationRegistry.getViolationType(1);
      expect(name).to.equal("Speeding");
      expect(baseFine).to.equal(ethers.parseEther("150"));
      expect(totalCount).to.equal(0);
    });
  });

  describe("Type Management", function () {
    it("Should allow owner to add new type", async function () {
      await expect(violationRegistry.addViolationType(
        6,
        "Test Violation",
        "Test description",
        ethers.parseEther("75")
      )).to.emit(violationRegistry, "ViolationTypeAdded");

      expect(await violationRegistry.isValidType(6)).to.be.true;
    });

    it("Should prevent non-owner from adding types", async function () {
      await expect(violationRegistry.connect(nonOwner).addViolationType(
        6,
        "Test",
        "Test",
        ethers.parseEther("75")
      )).to.be.revertedWithCustomError(violationRegistry, "Unauthorized");
    });

    it("Should allow owner to update base fines", async function () {
      const newFine = ethers.parseEther("175");
      await expect(violationRegistry.updateBaseFine(1, newFine))
        .to.emit(violationRegistry, "ViolationTypeUpdated")
        .withArgs(1, newFine);

      const [, , baseFine] = await violationRegistry.getViolationType(1);
      expect(baseFine).to.equal(newFine);
    });

    it("Should allow deactivating types", async function () {
      await expect(violationRegistry.deactivateType(1))
        .to.emit(violationRegistry, "ViolationTypeDeactivated");

      expect(await violationRegistry.isValidType(1)).to.be.false;
    });

    it("Should allow reactivating types", async function () {
      await violationRegistry.deactivateType(1);

      await expect(violationRegistry.activateType(1))
        .to.emit(violationRegistry, "ViolationTypeActivated");

      expect(await violationRegistry.isValidType(1)).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should revert for operations on invalid types", async function () {
      await expect(violationRegistry.getViolationType(99))
        .to.be.revertedWithCustomError(violationRegistry, "InvalidViolationType");
    });

    it("Should handle ownership transfer", async function () {
      await violationRegistry.transferOwnership(nonOwner.address);
      expect(await violationRegistry.owner()).to.equal(nonOwner.address);
    });

    it("Should revert transfer to zero address", async function () {
      await expect(violationRegistry.transferOwnership(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(violationRegistry, "Unauthorized");
    });
  });
});
