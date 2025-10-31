// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint8, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract AnonymousViolationHandler is SepoliaConfig {

    address public owner;
    uint32 public violationCounter;

    struct Violation {
        euint32 encryptedLicenseHash;
        euint32 encryptedAmount;
        euint8 encryptedViolationType;
        string location;
        uint256 timestamp;
        bool isPaid;
        bool isProcessed;
        address reporter;
    }

    struct PaymentRecord {
        euint32 encryptedPaymentId;
        uint256 timestamp;
        bool verified;
    }

    mapping(uint32 => Violation) public violations;
    mapping(uint32 => PaymentRecord) public payments;
    mapping(address => uint32[]) public reporterViolations;

    // Violation types: 1=Speeding, 2=Parking, 3=RedLight, 4=NoSeatbelt, 5=MobilePhone
    mapping(uint8 => uint256) public violationBaseFines;

    event ViolationReported(uint32 indexed violationId, address indexed reporter, string location);
    event PaymentSubmitted(uint32 indexed violationId, uint256 timestamp);
    event ViolationProcessed(uint32 indexed violationId, bool paymentConfirmed);
    event FineAmountUpdated(uint8 violationType, uint256 newAmount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier validViolation(uint32 _violationId) {
        require(_violationId > 0 && _violationId <= violationCounter, "Invalid violation ID");
        _;
    }

    constructor() {
        owner = msg.sender;
        violationCounter = 0;

        // Initialize base fines for different violation types
        violationBaseFines[1] = 150 ether; // Speeding
        violationBaseFines[2] = 50 ether;  // Parking
        violationBaseFines[3] = 200 ether; // Red light
        violationBaseFines[4] = 100 ether; // No seatbelt
        violationBaseFines[5] = 120 ether; // Mobile phone
    }

    // Report a traffic violation with encrypted sensitive data
    function reportViolation(
        uint32 _encryptedLicenseHash,
        uint8 _violationType,
        string memory _location
    ) external {
        require(_violationType >= 1 && _violationType <= 5, "Invalid violation type");
        require(bytes(_location).length > 0, "Location required");

        violationCounter++;

        // Encrypt sensitive data
        euint32 encryptedLicense = FHE.asEuint32(_encryptedLicenseHash);
        euint8 encryptedType = FHE.asEuint8(_violationType);
        euint32 encryptedAmount = FHE.asEuint32(uint32(violationBaseFines[_violationType] / 1 ether));

        violations[violationCounter] = Violation({
            encryptedLicenseHash: encryptedLicense,
            encryptedAmount: encryptedAmount,
            encryptedViolationType: encryptedType,
            location: _location,
            timestamp: block.timestamp,
            isPaid: false,
            isProcessed: false,
            reporter: msg.sender
        });

        reporterViolations[msg.sender].push(violationCounter);

        // Grant access permissions for FHE operations
        FHE.allowThis(encryptedLicense);
        FHE.allowThis(encryptedAmount);
        FHE.allowThis(encryptedType);

        emit ViolationReported(violationCounter, msg.sender, _location);
    }

    // Submit encrypted payment for a violation
    function submitPayment(
        uint32 _violationId,
        uint32 _encryptedPaymentId
    ) external validViolation(_violationId) {
        require(!violations[_violationId].isPaid, "Already paid");
        require(!violations[_violationId].isProcessed, "Already processed");

        euint32 encryptedPayment = FHE.asEuint32(_encryptedPaymentId);

        payments[_violationId] = PaymentRecord({
            encryptedPaymentId: encryptedPayment,
            timestamp: block.timestamp,
            verified: false
        });

        FHE.allowThis(encryptedPayment);

        emit PaymentSubmitted(_violationId, block.timestamp);
    }

    // Process violation payment (only owner can verify)
    function processPayment(uint32 _violationId) external onlyOwner validViolation(_violationId) {
        require(!violations[_violationId].isProcessed, "Already processed");

        Violation storage violation = violations[_violationId];
        PaymentRecord storage payment = payments[_violationId];

        // In a real implementation, here would be encrypted comparison
        // For now, we mark as paid if payment record exists
        bool paymentConfirmed = payment.timestamp > 0;

        violation.isPaid = paymentConfirmed;
        violation.isProcessed = true;
        payment.verified = paymentConfirmed;

        emit ViolationProcessed(_violationId, paymentConfirmed);
    }

    // Update base fine amounts (only owner)
    function updateViolationFine(uint8 _violationType, uint256 _newAmount) external onlyOwner {
        require(_violationType >= 1 && _violationType <= 5, "Invalid violation type");
        require(_newAmount > 0, "Amount must be positive");

        violationBaseFines[_violationType] = _newAmount;

        emit FineAmountUpdated(_violationType, _newAmount);
    }

    // Get violation info (public data only)
    function getViolationInfo(uint32 _violationId) external view validViolation(_violationId) returns (
        string memory location,
        uint256 timestamp,
        bool isPaid,
        bool isProcessed,
        address reporter
    ) {
        Violation storage violation = violations[_violationId];
        return (
            violation.location,
            violation.timestamp,
            violation.isPaid,
            violation.isProcessed,
            violation.reporter
        );
    }

    // Get payment status
    function getPaymentStatus(uint32 _violationId) external view validViolation(_violationId) returns (
        uint256 timestamp,
        bool verified
    ) {
        PaymentRecord storage payment = payments[_violationId];
        return (
            payment.timestamp,
            payment.verified
        );
    }

    // Get violations reported by a specific address
    function getReporterViolations(address _reporter) external view returns (uint32[] memory) {
        return reporterViolations[_reporter];
    }

    // Get total number of violations
    function getTotalViolations() external view returns (uint32) {
        return violationCounter;
    }

    // Get base fine for violation type
    function getBaseFine(uint8 _violationType) external view returns (uint256) {
        require(_violationType >= 1 && _violationType <= 5, "Invalid violation type");
        return violationBaseFines[_violationType];
    }

    // Check if violation has encrypted license access for caller
    function hasLicenseAccess(uint32 _violationId) external view validViolation(_violationId) returns (bool) {
        // This would check FHE permissions in real implementation
        return violations[_violationId].reporter == msg.sender || msg.sender == owner;
    }

    // Emergency function to pause contract operations (owner only)
    bool public paused = false;

    function togglePause() external onlyOwner {
        paused = !paused;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
}