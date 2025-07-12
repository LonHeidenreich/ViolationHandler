import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleViolationHandler } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Comprehensive test suite for Traffic Violation Reporter
 * Tests deployment, core functionality, access control, and edge cases
 * Following industry best practices with 45+ test cases
 */

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  carol: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = await ethers.getContractFactory("SimpleViolationHandler");
  const contract = await factory.deploy() as SimpleViolationHandler;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("SimpleViolationHandler", function () {
  let signers: Signers;
  let contract: SimpleViolationHandler;
  let contractAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      carol: ethSigners[3]
    };
  });

  beforeEach(async function () {
    ({ contract, contractAddress } = await deployFixture());
  });

  describe("Deployment and Initialization", function () {
    it("should deploy successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("should set the correct owner", async function () {
      expect(await contract.owner()).to.equal(signers.deployer.address);
    });

    it("should initialize violation counter to zero", async function () {
      expect(await contract.getTotalViolations()).to.equal(0);
    });

    it("should not be paused initially", async function () {
      expect(await contract.paused()).to.be.false;
    });

    it("should initialize owner as pauser", async function () {
      expect(await contract.isPauser(signers.deployer.address)).to.be.true;
      expect(await contract.pauserCount()).to.equal(1);
    });

    it("should initialize correct base fines", async function () {
      expect(await contract.getBaseFine(1)).to.equal(ethers.parseEther("0.001"));  // Speeding
      expect(await contract.getBaseFine(2)).to.equal(ethers.parseEther("0.0005")); // Parking
      expect(await contract.getBaseFine(3)).to.equal(ethers.parseEther("0.002"));  // Red light
      expect(await contract.getBaseFine(4)).to.equal(ethers.parseEther("0.001"));  // No seatbelt
      expect(await contract.getBaseFine(5)).to.equal(ethers.parseEther("0.0012")); // Mobile phone
    });
  });

  describe("Violation Reporting - Core Functionality", function () {
    it("should allow anyone to report a violation", async function () {
      const tx = await contract.connect(signers.alice).reportViolation(
        "ABC-1234",
        1, // Speeding
        25, // severity
        false,
        "Main St & 5th Ave"
      );

      await expect(tx)
        .to.emit(contract, "ViolationReported")
        .withArgs(1, signers.alice.address, "Main St & 5th Ave");

      expect(await contract.getTotalViolations()).to.equal(1);
    });

    it("should increment violation counter correctly", async function () {
      await contract.connect(signers.alice).reportViolation("ABC-1234", 1, 25, false, "Location 1");
      await contract.connect(signers.bob).reportViolation("XYZ-5678", 2, 50, false, "Location 2");
      await contract.connect(signers.alice).reportViolation("DEF-9012", 3, 75, false, "Location 3");

      expect(await contract.getTotalViolations()).to.equal(3);
    });

    it("should track violations per reporter", async function () {
      await contract.connect(signers.alice).reportViolation("ABC-1234", 1, 25, false, "Location 1");
      await contract.connect(signers.alice).reportViolation("XYZ-5678", 2, 50, false, "Location 2");
      await contract.connect(signers.bob).reportViolation("DEF-9012", 3, 75, false, "Location 3");

      const aliceViolations = await contract.getReporterViolations(signers.alice.address);
      const bobViolations = await contract.getReporterViolations(signers.bob.address);

      expect(aliceViolations.length).to.equal(2);
      expect(bobViolations.length).to.equal(1);
      expect(aliceViolations[0]).to.equal(1);
      expect(aliceViolations[1]).to.equal(2);
      expect(bobViolations[0]).to.equal(3);
    });

    it("should calculate fine amount with severity multiplier", async function () {
      await contract.connect(signers.alice).reportViolation("ABC-1234", 1, 50, false, "Location");

      const info = await contract.getViolationInfo(1);
      const baseFine = await contract.getBaseFine(1);
      const expected = (baseFine * 150n) / 100n; // 100 + 50 severity

      expect(info.amount).to.equal(expected);
    });

    it("should double fine for repeat offenders", async function () {
      await contract.connect(signers.alice).reportViolation("ABC-1234", 1, 0, true, "Location");

      const info = await contract.getViolationInfo(1);
      const baseFine = await contract.getBaseFine(1);
      const expectedWithoutRepeat = baseFine; // severity 0 = 100 multiplier
      const expectedWithRepeat = expectedWithoutRepeat * 2n;

      expect(info.amount).to.equal(expectedWithRepeat);
    });

    it("should store all violation data correctly", async function () {
      await contract.connect(signers.alice).reportViolation(
        "ABC-1234",
        2, // Parking
        30,
        false,
        "Downtown Parking Lot"
      );

      const info = await contract.getViolationInfo(1);

      expect(info.location).to.equal("Downtown Parking Lot");
      expect(info.violationType).to.equal(2);
      expect(info.isPaid).to.be.false;
      expect(info.isProcessed).to.be.false;
      expect(info.reporter).to.equal(signers.alice.address);
    });
  });

  describe("Violation Reporting - Input Validation", function () {
    it("should revert when location is empty", async function () {
      await expect(
        contract.connect(signers.alice).reportViolation("ABC-1234", 1, 25, false, "")
      ).to.be.revertedWithCustomError(contract, "LocationRequired");
    });

    it("should revert for invalid violation type (zero)", async function () {
      await expect(
        contract.connect(signers.alice).reportViolation("ABC-1234", 0, 25, false, "Location")
      ).to.be.revertedWithCustomError(contract, "InvalidViolationType");
    });

    it("should revert for invalid violation type (too high)", async function () {
      await expect(
        contract.connect(signers.alice).reportViolation("ABC-1234", 6, 25, false, "Location")
      ).to.be.revertedWithCustomError(contract, "InvalidViolationType");
    });

    it("should accept minimum severity score (0)", async function () {
      const tx = await contract.connect(signers.alice).reportViolation(
        "ABC-1234",
        1,
        0,
        false,
        "Location"
      );

      await expect(tx).to.emit(contract, "ViolationReported");
    });

    it("should accept maximum severity score (100)", async function () {
      const tx = await contract.connect(signers.alice).reportViolation(
        "ABC-1234",
        1,
        100,
        false,
        "Location"
      );

      await expect(tx).to.emit(contract, "ViolationReported");
    });
  });

  describe("Payment Submission", function () {
    beforeEach(async function () {
      // Report a violation before each payment test
      await contract.connect(signers.alice).reportViolation("ABC-1234", 1, 0, false, "Location");
    });

    it("should allow payment submission with correct amount", async function () {
      const info = await contract.getViolationInfo(1);
      const paymentId = ethers.randomBytes(32);

      const tx = await contract.connect(signers.bob).submitPayment(
        1,
        paymentId,
        { value: info.amount }
      );

      await expect(tx).to.emit(contract, "PaymentSubmitted");
    });

    it("should accept overpayment", async function () {
      const info = await contract.getViolationInfo(1);
      const paymentId = ethers.randomBytes(32);

      const overpayment = info.amount * 2n;
      const tx = await contract.connect(signers.bob).submitPayment(
        1,
        paymentId,
        { value: overpayment }
      );

      await expect(tx).to.emit(contract, "PaymentSubmitted");
    });

    it("should mark payment as invalid for underpayment", async function () {
      const info = await contract.getViolationInfo(1);
      const paymentId = ethers.randomBytes(32);

      const underpayment = info.amount / 2n;
      await contract.connect(signers.bob).submitPayment(
        1,
        paymentId,
        { value: underpayment }
      );

      const paymentStatus = await contract.getPaymentStatus(1);
      expect(paymentStatus.amount).to.equal(underpayment);
    });

    it("should revert when paying for already paid violation", async function () {
      const info = await contract.getViolationInfo(1);
      const paymentId = ethers.randomBytes(32);

      await contract.connect(signers.bob).submitPayment(1, paymentId, { value: info.amount });
      await contract.connect(signers.deployer).processPayment(1);

      await expect(
        contract.connect(signers.bob).submitPayment(1, paymentId, { value: info.amount })
      ).to.be.revertedWithCustomError(contract, "AlreadyPaid");
    });

    it("should revert when paying for processed violation", async function () {
      const info = await contract.getViolationInfo(1);
      const paymentId = ethers.randomBytes(32);

      await contract.connect(signers.bob).submitPayment(1, paymentId, { value: info.amount });
      await contract.connect(signers.deployer).processPayment(1);

      await expect(
        contract.connect(signers.bob).submitPayment(1, ethers.randomBytes(32), { value: info.amount })
      ).to.be.revertedWithCustomError(contract, "AlreadyProcessed");
    });

    it("should revert when paying for non-existent violation", async function () {
      await expect(
        contract.connect(signers.bob).submitPayment(999, ethers.randomBytes(32), { value: 1000 })
      ).to.be.revertedWithCustomError(contract, "InvalidViolationId");
    });
  });

  describe("Payment Processing", function () {
    beforeEach(async function () {
      await contract.connect(signers.alice).reportViolation("ABC-1234", 1, 0, false, "Location");
    });

    it("should allow owner to process valid payment", async function () {
      const info = await contract.getViolationInfo(1);
      const paymentId = ethers.randomBytes(32);

      await contract.connect(signers.bob).submitPayment(1, paymentId, { value: info.amount });

      const tx = await contract.connect(signers.deployer).processPayment(1);

      await expect(tx)
        .to.emit(contract, "ViolationProcessed")
        .withArgs(1, true);

      const updatedInfo = await contract.getViolationInfo(1);
      expect(updatedInfo.isPaid).to.be.true;
      expect(updatedInfo.isProcessed).to.be.true;
    });

    it("should mark violation as unpaid for invalid payment", async function () {
      const info = await contract.getViolationInfo(1);
      const paymentId = ethers.randomBytes(32);

      await contract.connect(signers.bob).submitPayment(1, paymentId, { value: info.amount / 2n });
      await contract.connect(signers.deployer).processPayment(1);

      const updatedInfo = await contract.getViolationInfo(1);
      expect(updatedInfo.isPaid).to.be.false;
      expect(updatedInfo.isProcessed).to.be.true;
    });

    it("should prevent non-owner from processing payments", async function () {
      const info = await contract.getViolationInfo(1);
      const paymentId = ethers.randomBytes(32);

      await contract.connect(signers.bob).submitPayment(1, paymentId, { value: info.amount });

      await expect(
        contract.connect(signers.alice).processPayment(1)
      ).to.be.revertedWithCustomError(contract, "Unauthorized");
    });

    it("should revert when processing already processed violation", async function () {
      const info = await contract.getViolationInfo(1);
      const paymentId = ethers.randomBytes(32);

      await contract.connect(signers.bob).submitPayment(1, paymentId, { value: info.amount });
      await contract.connect(signers.deployer).processPayment(1);

      await expect(
        contract.connect(signers.deployer).processPayment(1)
      ).to.be.revertedWithCustomError(contract, "AlreadyProcessed");
    });
  });

  describe("PauserSet Mechanism", function () {
    it("should allow owner to add pausers", async function () {
      const tx = await contract.connect(signers.deployer).addPauser(signers.alice.address);

      await expect(tx)
        .to.emit(contract, "PauserAdded")
        .withArgs(signers.alice.address);

      expect(await contract.isPauser(signers.alice.address)).to.be.true;
      expect(await contract.pauserCount()).to.equal(2);
    });

    it("should allow owner to remove pausers", async function () {
      await contract.connect(signers.deployer).addPauser(signers.alice.address);

      const tx = await contract.connect(signers.deployer).removePauser(signers.alice.address);

      await expect(tx)
        .to.emit(contract, "PauserRemoved")
        .withArgs(signers.alice.address);

      expect(await contract.isPauser(signers.alice.address)).to.be.false;
      expect(await contract.pauserCount()).to.equal(1);
    });

    it("should revert when adding existing pauser", async function () {
      await contract.connect(signers.deployer).addPauser(signers.alice.address);

      await expect(
        contract.connect(signers.deployer).addPauser(signers.alice.address)
      ).to.be.revertedWithCustomError(contract, "AlreadyPauser");
    });

    it("should revert when removing non-pauser", async function () {
      await expect(
        contract.connect(signers.deployer).removePauser(signers.alice.address)
      ).to.be.revertedWithCustomError(contract, "NotAPauser");
    });

    it("should allow pausers to toggle pause", async function () {
      await contract.connect(signers.deployer).addPauser(signers.alice.address);

      await contract.connect(signers.alice).togglePause();
      expect(await contract.paused()).to.be.true;

      await contract.connect(signers.alice).togglePause();
      expect(await contract.paused()).to.be.false;
    });

    it("should revert when non-pauser tries to toggle pause", async function () {
      await expect(
        contract.connect(signers.alice).togglePause()
      ).to.be.revertedWithCustomError(contract, "NotAPauser");
    });

    it("should prevent non-owner from adding pausers", async function () {
      await expect(
        contract.connect(signers.alice).addPauser(signers.bob.address)
      ).to.be.revertedWithCustomError(contract, "Unauthorized");
    });
  });

  describe("Pause Functionality", function () {
    beforeEach(async function () {
      await contract.connect(signers.deployer).togglePause();
    });

    it("should prevent reporting violations when paused", async function () {
      await expect(
        contract.connect(signers.alice).reportViolation("ABC-1234", 1, 25, false, "Location")
      ).to.be.revertedWithCustomError(contract, "ContractPaused");
    });

    it("should prevent payment submission when paused", async function () {
      await expect(
        contract.connect(signers.alice).submitPayment(1, ethers.randomBytes(32), { value: 1000 })
      ).to.be.revertedWithCustomError(contract, "ContractPaused");
    });

    it("should prevent payment processing when paused", async function () {
      await expect(
        contract.connect(signers.deployer).processPayment(1)
      ).to.be.revertedWithCustomError(contract, "ContractPaused");
    });

    it("should prevent fine updates when paused", async function () {
      await expect(
        contract.connect(signers.deployer).updateViolationFine(1, ethers.parseEther("0.002"))
      ).to.be.revertedWithCustomError(contract, "ContractPaused");
    });

    it("should allow operations after unpause", async function () {
      await contract.connect(signers.deployer).togglePause(); // Unpause

      const tx = await contract.connect(signers.alice).reportViolation(
        "ABC-1234",
        1,
        25,
        false,
        "Location"
      );

      await expect(tx).to.emit(contract, "ViolationReported");
    });
  });

  describe("Fine Management", function () {
    it("should allow owner to update violation fines", async function () {
      const newAmount = ethers.parseEther("0.002");

      const tx = await contract.connect(signers.deployer).updateViolationFine(1, newAmount);

      await expect(tx)
        .to.emit(contract, "FineAmountUpdated")
        .withArgs(1, newAmount);

      expect(await contract.getBaseFine(1)).to.equal(newAmount);
    });

    it("should prevent non-owner from updating fines", async function () {
      await expect(
        contract.connect(signers.alice).updateViolationFine(1, ethers.parseEther("0.002"))
      ).to.be.revertedWithCustomError(contract, "Unauthorized");
    });

    it("should revert when setting zero fine amount", async function () {
      await expect(
        contract.connect(signers.deployer).updateViolationFine(1, 0)
      ).to.be.revertedWithCustomError(contract, "AmountMustBePositive");
    });

    it("should revert for invalid violation type when updating fine", async function () {
      await expect(
        contract.connect(signers.deployer).updateViolationFine(0, ethers.parseEther("0.002"))
      ).to.be.revertedWithCustomError(contract, "InvalidViolationType");

      await expect(
        contract.connect(signers.deployer).updateViolationFine(6, ethers.parseEther("0.002"))
      ).to.be.revertedWithCustomError(contract, "InvalidViolationType");
    });

    it("should revert when getting base fine for invalid type", async function () {
      await expect(
        contract.getBaseFine(0)
      ).to.be.revertedWithCustomError(contract, "InvalidViolationType");

      await expect(
        contract.getBaseFine(6)
      ).to.be.revertedWithCustomError(contract, "InvalidViolationType");
    });
  });

  describe("View Functions", function () {
    it("should return correct violation info", async function () {
      await contract.connect(signers.alice).reportViolation(
        "ABC-1234",
        2,
        50,
        false,
        "Test Location"
      );

      const info = await contract.getViolationInfo(1);

      expect(info.location).to.equal("Test Location");
      expect(info.violationType).to.equal(2);
      expect(info.reporter).to.equal(signers.alice.address);
      expect(info.isPaid).to.be.false;
      expect(info.isProcessed).to.be.false;
    });

    it("should return payment status", async function () {
      await contract.connect(signers.alice).reportViolation("ABC-1234", 1, 0, false, "Location");

      const info = await contract.getViolationInfo(1);
      const paymentId = ethers.randomBytes(32);

      await contract.connect(signers.bob).submitPayment(1, paymentId, { value: info.amount });

      const paymentStatus = await contract.getPaymentStatus(1);
      expect(paymentStatus.amount).to.equal(info.amount);
      expect(paymentStatus.verified).to.be.false;
    });

    it("should return empty array for reporter with no violations", async function () {
      const violations = await contract.getReporterViolations(signers.carol.address);
      expect(violations.length).to.equal(0);
    });

    it("should revert when getting info for invalid violation", async function () {
      await expect(
        contract.getViolationInfo(0)
      ).to.be.revertedWithCustomError(contract, "InvalidViolationId");

      await expect(
        contract.getViolationInfo(999)
      ).to.be.revertedWithCustomError(contract, "InvalidViolationId");
    });

    it("should revert when getting payment status for invalid violation", async function () {
      await expect(
        contract.getPaymentStatus(0)
      ).to.be.revertedWithCustomError(contract, "InvalidViolationId");
    });
  });

  describe("Withdrawal Functionality", function () {
    beforeEach(async function () {
      // Create and pay for a violation
      await contract.connect(signers.alice).reportViolation("ABC-1234", 1, 0, false, "Location");
      const info = await contract.getViolationInfo(1);
      await contract.connect(signers.bob).submitPayment(1, ethers.randomBytes(32), { value: info.amount });
    });

    it("should allow owner to withdraw contract balance", async function () {
      const balanceBefore = await ethers.provider.getBalance(signers.deployer.address);
      const contractBalance = await ethers.provider.getBalance(contractAddress);

      const tx = await contract.connect(signers.deployer).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(signers.deployer.address);

      expect(balanceAfter).to.equal(balanceBefore + contractBalance - gasUsed);
    });

    it("should prevent non-owner from withdrawing", async function () {
      await expect(
        contract.connect(signers.alice).withdraw()
      ).to.be.revertedWithCustomError(contract, "Unauthorized");
    });
  });

  describe("Edge Cases and Gas Optimization", function () {
    it("should handle multiple violations from same reporter", async function () {
      for (let i = 0; i < 5; i++) {
        await contract.connect(signers.alice).reportViolation(
          `LICENSE-${i}`,
          (i % 5) + 1,
          i * 10,
          false,
          `Location ${i}`
        );
      }

      const violations = await contract.getReporterViolations(signers.alice.address);
      expect(violations.length).to.equal(5);
      expect(await contract.getTotalViolations()).to.equal(5);
    });

    it("should handle all violation types", async function () {
      for (let type = 1; type <= 5; type++) {
        await contract.connect(signers.alice).reportViolation(
          `LICENSE-${type}`,
          type,
          0,
          false,
          `Location ${type}`
        );
      }

      expect(await contract.getTotalViolations()).to.equal(5);
    });

    it("should handle maximum severity score correctly", async function () {
      await contract.connect(signers.alice).reportViolation("ABC-1234", 1, 100, false, "Location");

      const info = await contract.getViolationInfo(1);
      const baseFine = await contract.getBaseFine(1);
      const expected = (baseFine * 200n) / 100n; // 100 + 100 severity = 200% multiplier

      expect(info.amount).to.equal(expected);
    });

    it("should handle minimum severity score correctly", async function () {
      await contract.connect(signers.alice).reportViolation("ABC-1234", 1, 0, false, "Location");

      const info = await contract.getViolationInfo(1);
      const baseFine = await contract.getBaseFine(1);
      const expected = (baseFine * 100n) / 100n; // 100 + 0 severity = 100% multiplier

      expect(info.amount).to.equal(baseFine);
    });

    it("should accept payments to receive function", async function () {
      const tx = await signers.alice.sendTransaction({
        to: contractAddress,
        value: ethers.parseEther("1")
      });

      await expect(tx).to.not.be.reverted;
    });
  });
});
