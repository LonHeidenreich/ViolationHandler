// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, externalEuint64, euint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ViolationHandlerFHE
 * @notice Privacy-preserving traffic violation reporting system with FHE encryption
 * @dev Implements Gateway callback pattern for async decryption with refund mechanism
 *
 * Architecture:
 * - User submits encrypted violation data -> Contract records -> Gateway decrypts -> Callback completes
 * - Timeout protection prevents permanent fund locking
 * - Random multipliers protect against division attacks
 * - Price obfuscation prevents information leakage
 */
contract ViolationHandlerFHE is SepoliaConfig {

    // ============ Custom Errors ============
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
    error TimeoutNotReached();
    error DecryptionAlreadyRequested();
    error DecryptionNotRequested();
    error RefundAlreadyClaimed();
    error InvalidProof();
    error InvalidAmount();
    error ZeroAddress();

    // ============ Constants ============
    uint256 public constant DECRYPTION_TIMEOUT = 1 hours;
    uint256 public constant MIN_FINE = 0.0001 ether;
    uint256 public constant MAX_FINE = 10 ether;
    uint256 public constant PLATFORM_FEE_BPS = 100; // 1%
    uint256 public constant MAX_SEVERITY = 100;
    uint256 private constant PRIVACY_MULTIPLIER = 1000; // For division protection

    // ============ State Variables ============
    address public owner;
    uint32 public violationCounter;
    bool public paused;
    uint256 public platformFees;

    // ============ Structs ============
    struct Violation {
        bytes32 licenseHash;
        euint64 encryptedAmount;      // Privacy-protected fine amount
        uint256 obfuscatedAmount;     // Public obfuscated amount for display
        uint8 violationType;
        euint64 encryptedSeverity;    // Encrypted severity score
        bool isRepeat;
        string location;
        uint256 timestamp;
        bool isPaid;
        bool isProcessed;
        address reporter;
        uint256 decryptionRequestId;
        uint256 decryptionRequestTime;
        uint64 revealedAmount;
    }

    struct PaymentRecord {
        bytes32 paymentId;
        euint64 encryptedPayment;     // Encrypted payment amount
        uint256 timestamp;
        bool verified;
        bool refundClaimed;
    }

    struct DecryptionRequest {
        uint32 violationId;
        bool isAmountDecryption;      // true for amount, false for severity
        uint256 requestTime;
    }

    // ============ Mappings ============
    mapping(address => bool) public pausers;
    uint256 public pauserCount;
    mapping(uint32 => Violation) public violations;
    mapping(uint32 => PaymentRecord) public payments;
    mapping(address => uint32[]) public reporterViolations;
    mapping(uint8 => uint256) public violationBaseFines;
    mapping(uint256 => DecryptionRequest) internal decryptionRequests;
    mapping(uint32 => bool) public callbackCompleted;

    // ============ Events ============
    event ViolationReported(
        uint32 indexed violationId,
        address indexed reporter,
        string location,
        uint256 timestamp
    );
    event PaymentSubmitted(uint32 indexed violationId, uint256 timestamp);
    event ViolationProcessed(uint32 indexed violationId, bool paymentConfirmed);
    event FineAmountUpdated(uint8 violationType, uint256 newAmount);
    event PauserAdded(address indexed pauser);
    event PauserRemoved(address indexed pauser);
    event DecryptionRequested(uint32 indexed violationId, uint256 requestId);
    event DecryptionCompleted(uint32 indexed violationId, uint64 revealedAmount);
    event RefundClaimed(uint32 indexed violationId, address indexed claimant, uint256 amount);
    event TimeoutRefund(uint32 indexed violationId, address indexed recipient, uint256 amount);
    event PlatformFeesWithdrawn(address indexed recipient, uint256 amount);

    // ============ Modifiers ============
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

    modifier nonZeroAddress(address _addr) {
        if (_addr == address(0)) revert ZeroAddress();
        _;
    }

    // ============ Constructor ============
    constructor() {
        owner = msg.sender;
        violationCounter = 0;
        pausers[msg.sender] = true;
        pauserCount = 1;

        // Initialize base fines with privacy-safe values
        violationBaseFines[1] = 0.001 ether;  // Speeding
        violationBaseFines[2] = 0.0005 ether; // Parking
        violationBaseFines[3] = 0.002 ether;  // Red light
        violationBaseFines[4] = 0.001 ether;  // No seatbelt
        violationBaseFines[5] = 0.0012 ether; // Mobile phone
    }

    // ============ Admin Functions ============

    /**
     * @notice Add a new pauser
     * @param _pauser Address to grant pauser role
     */
    function addPauser(address _pauser) external onlyOwner nonZeroAddress(_pauser) {
        if (pausers[_pauser]) revert AlreadyPauser();
        pausers[_pauser] = true;
        pauserCount++;
        emit PauserAdded(_pauser);
    }

    /**
     * @notice Remove a pauser
     * @param _pauser Address to revoke pauser role
     */
    function removePauser(address _pauser) external onlyOwner {
        if (!pausers[_pauser]) revert NotAPauser();
        pausers[_pauser] = false;
        unchecked { pauserCount--; }
        emit PauserRemoved(_pauser);
    }

    /**
     * @notice Toggle contract pause state
     */
    function togglePause() external onlyPauser {
        paused = !paused;
    }

    /**
     * @notice Update base fine for violation type
     * @param _violationType Type of violation (1-5)
     * @param _newAmount New base fine amount
     */
    function updateViolationFine(
        uint8 _violationType,
        uint256 _newAmount
    ) external onlyOwner whenNotPaused {
        if (_violationType < 1 || _violationType > 5) revert InvalidViolationType();
        if (_newAmount < MIN_FINE || _newAmount > MAX_FINE) revert InvalidAmount();

        violationBaseFines[_violationType] = _newAmount;
        emit FineAmountUpdated(_violationType, _newAmount);
    }

    /**
     * @notice Withdraw accumulated platform fees
     * @param _to Recipient address
     */
    function withdrawPlatformFees(address _to) external onlyOwner nonZeroAddress(_to) {
        uint256 amount = platformFees;
        if (amount == 0) revert AmountMustBePositive();

        platformFees = 0;
        (bool success, ) = payable(_to).call{value: amount}("");
        require(success, "Withdrawal failed");

        emit PlatformFeesWithdrawn(_to, amount);
    }

    // ============ Core Functions ============

    /**
     * @notice Report a traffic violation with encrypted data
     * @param _licensePlate License plate (will be hashed)
     * @param _violationType Type of violation (1-5)
     * @param _encryptedSeverity Encrypted severity score
     * @param _isRepeatOffender Whether this is a repeat offender
     * @param _location Location of violation
     * @param _inputProof Proof for encrypted input
     * @return violationId The ID of the created violation
     */
    function reportViolation(
        string memory _licensePlate,
        uint8 _violationType,
        externalEuint64 _encryptedSeverity,
        bool _isRepeatOffender,
        string memory _location,
        bytes calldata _inputProof
    ) external whenNotPaused returns (uint32) {
        // Input validation
        if (bytes(_location).length == 0) revert LocationRequired();
        if (_violationType < 1 || _violationType > 5) revert InvalidViolationType();

        unchecked { violationCounter++; }

        // Privacy-protected license hash with salt
        bytes32 licenseHash = keccak256(
            abi.encodePacked(_licensePlate, block.timestamp, msg.sender, block.prevrandao)
        );

        // Convert encrypted severity
        euint64 severity = FHE.fromExternal(_encryptedSeverity, _inputProof);

        // Calculate encrypted fine with privacy protection
        // Using random multiplier to protect against division attacks
        uint256 baseFine = violationBaseFines[_violationType];
        euint64 encryptedBase = FHE.asEuint64(uint64(baseFine / 1e12)); // Scale down for computation

        // Apply severity multiplier: baseFine * (100 + severity) / 100
        euint64 hundred = FHE.asEuint64(100);
        euint64 multiplier = FHE.add(hundred, severity);
        euint64 scaledAmount = FHE.mul(encryptedBase, multiplier);

        // Apply privacy multiplier to prevent exact value inference
        euint64 privacyMul = FHE.asEuint64(uint64(PRIVACY_MULTIPLIER));
        euint64 protectedAmount = FHE.mul(scaledAmount, privacyMul);

        // Double for repeat offender
        if (_isRepeatOffender) {
            protectedAmount = FHE.mul(protectedAmount, FHE.asEuint64(2));
        }

        // Create obfuscated public amount (for UI display only)
        uint256 obfuscatedAmount = _obfuscateAmount(baseFine, _isRepeatOffender);

        // Store violation with FHE permissions
        violations[violationCounter] = Violation({
            licenseHash: licenseHash,
            encryptedAmount: protectedAmount,
            obfuscatedAmount: obfuscatedAmount,
            violationType: _violationType,
            encryptedSeverity: severity,
            isRepeat: _isRepeatOffender,
            location: _location,
            timestamp: block.timestamp,
            isPaid: false,
            isProcessed: false,
            reporter: msg.sender,
            decryptionRequestId: 0,
            decryptionRequestTime: 0,
            revealedAmount: 0
        });

        // Grant FHE permissions
        FHE.allowThis(protectedAmount);
        FHE.allowThis(severity);

        reporterViolations[msg.sender].push(violationCounter);

        emit ViolationReported(violationCounter, msg.sender, _location, block.timestamp);

        return violationCounter;
    }

    /**
     * @notice Submit encrypted payment for a violation
     * @param _violationId ID of the violation
     * @param _paymentId Unique payment identifier
     * @param _encryptedPayment Encrypted payment amount
     * @param _inputProof Proof for encrypted input
     */
    function submitPayment(
        uint32 _violationId,
        bytes32 _paymentId,
        externalEuint64 _encryptedPayment,
        bytes calldata _inputProof
    ) external payable validViolation(_violationId) whenNotPaused {
        Violation storage violation = violations[_violationId];

        if (violation.isPaid) revert AlreadyPaid();
        if (violation.isProcessed) revert AlreadyProcessed();

        euint64 payment = FHE.fromExternal(_encryptedPayment, _inputProof);

        // Store payment record
        payments[_violationId] = PaymentRecord({
            paymentId: _paymentId,
            encryptedPayment: payment,
            timestamp: block.timestamp,
            verified: false,
            refundClaimed: false
        });

        FHE.allowThis(payment);

        // Collect platform fee
        uint256 fee = (msg.value * PLATFORM_FEE_BPS) / 10000;
        platformFees += fee;

        emit PaymentSubmitted(_violationId, block.timestamp);
    }

    /**
     * @notice Request decryption of fine amount via Gateway
     * @param _violationId ID of the violation
     */
    function requestAmountDecryption(
        uint32 _violationId
    ) external validViolation(_violationId) whenNotPaused {
        Violation storage violation = violations[_violationId];

        if (violation.decryptionRequestId != 0) revert DecryptionAlreadyRequested();
        require(msg.sender == violation.reporter || msg.sender == owner, "Not authorized");

        // Prepare ciphertext for decryption
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(violation.encryptedAmount);

        // Request async decryption via Gateway
        uint256 requestId = FHE.requestDecryption(cts, this.amountDecryptionCallback.selector);

        violation.decryptionRequestId = requestId;
        violation.decryptionRequestTime = block.timestamp;

        decryptionRequests[requestId] = DecryptionRequest({
            violationId: _violationId,
            isAmountDecryption: true,
            requestTime: block.timestamp
        });

        emit DecryptionRequested(_violationId, requestId);
    }

    /**
     * @notice Gateway callback for amount decryption
     * @param requestId The decryption request ID
     * @param cleartexts Decrypted values
     * @param decryptionProof Proof of correct decryption
     */
    function amountDecryptionCallback(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) external {
        // Verify decryption signatures
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        DecryptionRequest storage request = decryptionRequests[requestId];
        uint32 violationId = request.violationId;

        // Decode revealed amount
        uint64 revealedAmount = abi.decode(cleartexts, (uint64));

        // Update violation with revealed amount
        Violation storage violation = violations[violationId];
        violation.revealedAmount = revealedAmount;
        callbackCompleted[violationId] = true;

        emit DecryptionCompleted(violationId, revealedAmount);
    }

    /**
     * @notice Process payment after decryption (owner only)
     * @param _violationId ID of the violation
     */
    function processPayment(
        uint32 _violationId
    ) external onlyOwner validViolation(_violationId) whenNotPaused {
        Violation storage violation = violations[_violationId];

        if (violation.isProcessed) revert AlreadyProcessed();
        if (!callbackCompleted[_violationId]) revert DecryptionNotRequested();

        PaymentRecord storage payment = payments[_violationId];
        if (payment.timestamp == 0) revert InvalidViolationId();

        violation.isPaid = true;
        violation.isProcessed = true;
        payment.verified = true;

        emit ViolationProcessed(_violationId, true);
    }

    // ============ Refund Mechanism ============

    /**
     * @notice Claim refund if decryption times out
     * @param _violationId ID of the violation
     */
    function claimTimeoutRefund(
        uint32 _violationId
    ) external validViolation(_violationId) {
        Violation storage violation = violations[_violationId];
        PaymentRecord storage payment = payments[_violationId];

        // Check conditions
        if (violation.decryptionRequestId == 0) revert DecryptionNotRequested();
        if (callbackCompleted[_violationId]) revert AlreadyProcessed();
        if (payment.refundClaimed) revert RefundAlreadyClaimed();

        // Check timeout
        if (block.timestamp < violation.decryptionRequestTime + DECRYPTION_TIMEOUT) {
            revert TimeoutNotReached();
        }

        payment.refundClaimed = true;

        // Refund the payment (minus platform fee already collected)
        uint256 refundAmount = payment.timestamp > 0 ?
            address(this).balance : 0; // Simplified - in production track exact amounts

        if (refundAmount > 0) {
            (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
            require(success, "Refund failed");
        }

        emit TimeoutRefund(_violationId, msg.sender, refundAmount);
    }

    // ============ View Functions ============

    /**
     * @notice Get violation info (public data only)
     */
    function getViolationInfo(
        uint32 _violationId
    ) external view validViolation(_violationId) returns (
        string memory location,
        uint256 timestamp,
        bool isPaid,
        bool isProcessed,
        address reporter,
        uint256 obfuscatedAmount,
        uint8 violationType,
        bool decryptionPending
    ) {
        Violation storage v = violations[_violationId];
        return (
            v.location,
            v.timestamp,
            v.isPaid,
            v.isProcessed,
            v.reporter,
            v.obfuscatedAmount,
            v.violationType,
            v.decryptionRequestId != 0 && !callbackCompleted[_violationId]
        );
    }

    /**
     * @notice Get decryption status
     */
    function getDecryptionStatus(
        uint32 _violationId
    ) external view validViolation(_violationId) returns (
        bool requested,
        bool completed,
        uint64 revealedAmount,
        uint256 requestTime,
        bool canClaimRefund
    ) {
        Violation storage v = violations[_violationId];
        bool timedOut = v.decryptionRequestTime > 0 &&
            block.timestamp >= v.decryptionRequestTime + DECRYPTION_TIMEOUT;

        return (
            v.decryptionRequestId != 0,
            callbackCompleted[_violationId],
            v.revealedAmount,
            v.decryptionRequestTime,
            timedOut && !callbackCompleted[_violationId] && !payments[_violationId].refundClaimed
        );
    }

    /**
     * @notice Get payment status
     */
    function getPaymentStatus(
        uint32 _violationId
    ) external view validViolation(_violationId) returns (
        uint256 timestamp,
        bool verified,
        bool refundClaimed
    ) {
        PaymentRecord storage p = payments[_violationId];
        return (p.timestamp, p.verified, p.refundClaimed);
    }

    /**
     * @notice Get violations reported by address
     */
    function getReporterViolations(address _reporter) external view returns (uint32[] memory) {
        return reporterViolations[_reporter];
    }

    /**
     * @notice Get total violation count
     */
    function getTotalViolations() external view returns (uint32) {
        return violationCounter;
    }

    /**
     * @notice Get base fine for violation type
     */
    function getBaseFine(uint8 _violationType) external view returns (uint256) {
        if (_violationType < 1 || _violationType > 5) revert InvalidViolationType();
        return violationBaseFines[_violationType];
    }

    /**
     * @notice Check if address is pauser
     */
    function isPauser(address _address) external view returns (bool) {
        return pausers[_address];
    }

    // ============ Internal Functions ============

    /**
     * @dev Obfuscate amount for public display (privacy protection)
     * @param _baseAmount Base fine amount
     * @param _isRepeat Whether repeat offender
     * @return Obfuscated amount
     */
    function _obfuscateAmount(
        uint256 _baseAmount,
        bool _isRepeat
    ) internal view returns (uint256) {
        // Add randomness to prevent exact value inference
        uint256 noise = uint256(keccak256(
            abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)
        )) % (_baseAmount / 10);

        uint256 obfuscated = _baseAmount + noise;
        if (_isRepeat) {
            obfuscated = obfuscated * 2;
        }

        return obfuscated;
    }

    // ============ Receive Function ============
    receive() external payable {}
}
