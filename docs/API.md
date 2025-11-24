# ViolationHandlerFHE API Documentation

## Overview

Privacy-preserving traffic violation reporting system with FHE encryption and Gateway callback pattern.

---

## Write Functions

### `reportViolation`

Report a traffic violation with encrypted severity data.

```solidity
function reportViolation(
    string memory _licensePlate,
    uint8 _violationType,
    externalEuint64 _encryptedSeverity,
    bool _isRepeatOffender,
    string memory _location,
    bytes calldata _inputProof
) external returns (uint32 violationId)
```

**Parameters:**
- `_licensePlate`: License plate (hashed for privacy)
- `_violationType`: 1=Speeding, 2=Parking, 3=RedLight, 4=NoSeatbelt, 5=MobilePhone
- `_encryptedSeverity`: Encrypted severity score (1-100)
- `_isRepeatOffender`: Doubles fine if true
- `_location`: Location description
- `_inputProof`: FHE input proof

**Returns:** `violationId` - Unique violation identifier

**Events:** `ViolationReported(violationId, reporter, location, timestamp)`

---

### `submitPayment`

Submit encrypted payment for a violation.

```solidity
function submitPayment(
    uint32 _violationId,
    bytes32 _paymentId,
    externalEuint64 _encryptedPayment,
    bytes calldata _inputProof
) external payable
```

**Parameters:**
- `_violationId`: Violation to pay for
- `_paymentId`: Unique payment identifier
- `_encryptedPayment`: Encrypted payment amount
- `_inputProof`: FHE input proof

**Events:** `PaymentSubmitted(violationId, timestamp)`

---

### `requestAmountDecryption`

Request Gateway decryption of fine amount.

```solidity
function requestAmountDecryption(uint32 _violationId) external
```

**Authorization:** Reporter or owner only

**Events:** `DecryptionRequested(violationId, requestId)`

---

### `amountDecryptionCallback`

Gateway callback after decryption (called by Gateway only).

```solidity
function amountDecryptionCallback(
    uint256 requestId,
    bytes memory cleartexts,
    bytes memory decryptionProof
) external
```

**Events:** `DecryptionCompleted(violationId, revealedAmount)`

---

### `processPayment`

Process payment after decryption completes.

```solidity
function processPayment(uint32 _violationId) external
```

**Authorization:** Owner only

**Events:** `ViolationProcessed(violationId, paymentConfirmed)`

---

### `claimTimeoutRefund`

Claim refund if decryption times out (1 hour).

```solidity
function claimTimeoutRefund(uint32 _violationId) external
```

**Conditions:**
- Decryption must be requested
- Timeout period must have passed
- Callback must not be completed
- Refund not already claimed

**Events:** `TimeoutRefund(violationId, recipient, amount)`

---

## Admin Functions

### `addPauser` / `removePauser`

Manage pauser role.

```solidity
function addPauser(address _pauser) external onlyOwner
function removePauser(address _pauser) external onlyOwner
```

---

### `togglePause`

Toggle contract pause state.

```solidity
function togglePause() external onlyPauser
```

---

### `updateViolationFine`

Update base fine for violation type.

```solidity
function updateViolationFine(uint8 _violationType, uint256 _newAmount) external onlyOwner
```

**Constraints:** `MIN_FINE <= _newAmount <= MAX_FINE`

---

### `withdrawPlatformFees`

Withdraw accumulated platform fees.

```solidity
function withdrawPlatformFees(address _to) external onlyOwner
```

---

## Read Functions

### `getViolationInfo`

```solidity
function getViolationInfo(uint32 _violationId) external view returns (
    string memory location,
    uint256 timestamp,
    bool isPaid,
    bool isProcessed,
    address reporter,
    uint256 obfuscatedAmount,
    uint8 violationType,
    bool decryptionPending
)
```

---

### `getDecryptionStatus`

```solidity
function getDecryptionStatus(uint32 _violationId) external view returns (
    bool requested,
    bool completed,
    uint64 revealedAmount,
    uint256 requestTime,
    bool canClaimRefund
)
```

---

### `getPaymentStatus`

```solidity
function getPaymentStatus(uint32 _violationId) external view returns (
    uint256 timestamp,
    bool verified,
    bool refundClaimed
)
```

---

### `getReporterViolations`

```solidity
function getReporterViolations(address _reporter) external view returns (uint32[] memory)
```

---

### `getTotalViolations`

```solidity
function getTotalViolations() external view returns (uint32)
```

---

### `getBaseFine`

```solidity
function getBaseFine(uint8 _violationType) external view returns (uint256)
```

---

### `isPauser`

```solidity
function isPauser(address _address) external view returns (bool)
```

---

## Constants

| Name | Value | Description |
|------|-------|-------------|
| `DECRYPTION_TIMEOUT` | 1 hour | Time before refund available |
| `MIN_FINE` | 0.0001 ether | Minimum fine amount |
| `MAX_FINE` | 10 ether | Maximum fine amount |
| `PLATFORM_FEE_BPS` | 100 | 1% platform fee |
| `MAX_SEVERITY` | 100 | Maximum severity score |

---

## Error Codes

| Error | Description |
|-------|-------------|
| `Unauthorized` | Caller not authorized |
| `InvalidViolationType` | Type not 1-5 |
| `LocationRequired` | Empty location |
| `InvalidViolationId` | ID doesn't exist |
| `AlreadyPaid` | Violation already paid |
| `AlreadyProcessed` | Already processed |
| `TimeoutNotReached` | Cannot refund yet |
| `DecryptionAlreadyRequested` | Duplicate request |
| `DecryptionNotRequested` | No pending request |
| `RefundAlreadyClaimed` | Duplicate refund |
| `ContractPaused` | Contract is paused |

---

## Integration Example

```javascript
// Report violation
const severity = await fhe.encrypt64(75); // severity 75/100
const tx = await contract.reportViolation(
    "ABC123",
    1, // Speeding
    severity,
    false, // not repeat
    "Main St & 1st Ave",
    inputProof
);

// Get violation ID from event
const violationId = tx.events.ViolationReported.violationId;

// Request decryption
await contract.requestAmountDecryption(violationId);

// Wait for callback (or timeout)
const status = await contract.getDecryptionStatus(violationId);
if (status.completed) {
    // Process payment
    await contract.processPayment(violationId);
} else if (status.canClaimRefund) {
    // Claim timeout refund
    await contract.claimTimeoutRefund(violationId);
}
```
