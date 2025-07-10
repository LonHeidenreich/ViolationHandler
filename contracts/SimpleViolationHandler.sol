// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SimpleViolationHandler
 * @notice Simplified version for deployment without FHE dependencies
 * @dev This is a demonstration contract for violation reporting system
 */
contract SimpleViolationHandler {

    // Custom errors
    error Unauthorized();
    error InvalidViolationType();
    error LocationRequired();
    error InvalidViolationId();
    error AlreadyPaid();
    error AlreadyProcessed();
    error AmountMustBePositive();
    error ContractPaused();
    error NotAPauser();
    error AlreadyPauser();

    address public owner;
    uint32 public violationCounter;

    struct Violation {
        bytes32 licenseHash;        // Hashed license plate
        uint256 amount;             // Fine amount
        uint8 violationType;         // 1-5
        uint32 severityScore;        // 1-100
        bool isRepeat;              // Repeat offender flag
        string location;
        uint256 timestamp;
        bool isPaid;
        bool isProcessed;
        address reporter;
    }

    struct PaymentRecord {
        bytes32 paymentId;
        uint256 paymentAmount;
        bool paymentValid;
        uint256 timestamp;
        bool verified;
    }

    // PauserSet mechanism
    mapping(address => bool) public pausers;
    uint256 public pauserCount;

    mapping(uint32 => Violation) public violations;
    mapping(uint32 => PaymentRecord) public payments;
    mapping(address => uint32[]) public reporterViolations;

    // Violation types: 1=Speeding, 2=Parking, 3=RedLight, 4=NoSeatbelt, 5=MobilePhone
    mapping(uint8 => uint256) public violationBaseFines;

    event ViolationReported(uint32 indexed violationId, address indexed reporter, string location);
    event PaymentSubmitted(uint32 indexed violationId, uint256 timestamp);
    event ViolationProcessed(uint32 indexed violationId, bool paymentConfirmed);
    event FineAmountUpdated(uint8 violationType, uint256 newAmount);
    event PauserAdded(address indexed pauser);
    event PauserRemoved(address indexed pauser);

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyPauser() {
        if (!pausers[msg.sender]) revert NotAPauser();
        _;
    }

    modifier validViolation(uint32 _violationId) {
        if (_violationId == 0 || _violationId > violationCounter) revert InvalidViolationId();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    // Emergency pause state
    bool public paused = false;

    constructor() {
        owner = msg.sender;
        violationCounter = 0;

        // Initialize owner as first pauser
        pausers[msg.sender] = true;
        pauserCount = 1;

        // Initialize base fines for different violation types (in wei)
        violationBaseFines[1] = 0.001 ether; // Speeding
        violationBaseFines[2] = 0.0005 ether;  // Parking
        violationBaseFines[3] = 0.002 ether; // Red light
        violationBaseFines[4] = 0.001 ether; // No seatbelt
        violationBaseFines[5] = 0.0012 ether; // Mobile phone
    }

    // PauserSet functions
    function addPauser(address _pauser) external onlyOwner {
        if (pausers[_pauser]) revert AlreadyPauser();
        pausers[_pauser] = true;
        pauserCount++;
        emit PauserAdded(_pauser);
    }

    function removePauser(address _pauser) external onlyOwner {
        if (!pausers[_pauser]) revert NotAPauser();
        pausers[_pauser] = false;
        pauserCount--;
        emit PauserRemoved(_pauser);
    }

    function togglePause() external onlyPauser {
        paused = !paused;
    }

    // Report a traffic violation
    function reportViolation(
        string memory _licensePlate,
        uint8 _violationType,
        uint32 _severityScore,
        bool _isRepeatOffender,
        string memory _location
    ) external whenNotPaused returns (uint32) {
        if (bytes(_location).length == 0) revert LocationRequired();
        if (_violationType < 1 || _violationType > 5) revert InvalidViolationType();

        violationCounter++;

        // Hash the license plate for privacy
        bytes32 licenseHash = keccak256(abi.encodePacked(_licensePlate, block.timestamp, msg.sender));

        // Calculate fine amount with severity multiplier
        uint256 baseFine = violationBaseFines[_violationType];
        uint256 severityMultiplier = 100 + _severityScore; // 100-200
        uint256 amountWithSeverity = (baseFine * severityMultiplier) / 100;

        // Double if repeat offender
        uint256 finalAmount = _isRepeatOffender ? amountWithSeverity * 2 : amountWithSeverity;

        violations[violationCounter] = Violation({
            licenseHash: licenseHash,
            amount: finalAmount,
            violationType: _violationType,
            severityScore: _severityScore,
            isRepeat: _isRepeatOffender,
            location: _location,
            timestamp: block.timestamp,
            isPaid: false,
            isProcessed: false,
            reporter: msg.sender
        });

        reporterViolations[msg.sender].push(violationCounter);

        emit ViolationReported(violationCounter, msg.sender, _location);

        return violationCounter;
    }

    // Submit payment for a violation
    function submitPayment(
        uint32 _violationId,
        bytes32 _paymentId
    ) external payable validViolation(_violationId) whenNotPaused {
        if (violations[_violationId].isPaid) revert AlreadyPaid();
        if (violations[_violationId].isProcessed) revert AlreadyProcessed();

        uint256 requiredAmount = violations[_violationId].amount;
        bool amountMatches = msg.value >= requiredAmount;

        payments[_violationId] = PaymentRecord({
            paymentId: _paymentId,
            paymentAmount: msg.value,
            paymentValid: amountMatches,
            timestamp: block.timestamp,
            verified: false
        });

        emit PaymentSubmitted(_violationId, block.timestamp);
    }

    // Process payment (owner only)
    function processPayment(uint32 _violationId) external onlyOwner validViolation(_violationId) whenNotPaused {
        if (violations[_violationId].isProcessed) revert AlreadyProcessed();

        PaymentRecord storage payment = payments[_violationId];
        if (payment.timestamp == 0) revert InvalidViolationId();

        // Mark as paid if payment is valid
        violations[_violationId].isPaid = payment.paymentValid;
        violations[_violationId].isProcessed = true;
        payment.verified = payment.paymentValid;

        emit ViolationProcessed(_violationId, payment.paymentValid);
    }

    // Update base fine amounts (only owner)
    function updateViolationFine(uint8 _violationType, uint256 _newAmount) external onlyOwner whenNotPaused {
        if (_violationType < 1 || _violationType > 5) revert InvalidViolationType();
        if (_newAmount == 0) revert AmountMustBePositive();

        violationBaseFines[_violationType] = _newAmount;

        emit FineAmountUpdated(_violationType, _newAmount);
    }

    // Get violation info (public data only)
    function getViolationInfo(uint32 _violationId) external view validViolation(_violationId) returns (
        string memory location,
        uint256 timestamp,
        bool isPaid,
        bool isProcessed,
        address reporter,
        uint256 amount,
        uint8 violationType
    ) {
        Violation storage violation = violations[_violationId];
        return (
            violation.location,
            violation.timestamp,
            violation.isPaid,
            violation.isProcessed,
            violation.reporter,
            violation.amount,
            violation.violationType
        );
    }

    // Get payment status
    function getPaymentStatus(uint32 _violationId) external view validViolation(_violationId) returns (
        uint256 timestamp,
        bool verified,
        uint256 amount
    ) {
        PaymentRecord storage payment = payments[_violationId];
        return (
            payment.timestamp,
            payment.verified,
            payment.paymentAmount
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
        if (_violationType < 1 || _violationType > 5) revert InvalidViolationType();
        return violationBaseFines[_violationType];
    }

    // Check if address is a pauser
    function isPauser(address _address) external view returns (bool) {
        return pausers[_address];
    }

    // Withdraw collected fines (owner only)
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    // Receive function to accept payments
    receive() external payable {}
}
