# ViolationHandlerFHE Architecture

## Overview

Privacy-preserving traffic violation reporting system using Fully Homomorphic Encryption (FHE) with Gateway callback pattern for secure, asynchronous decryption.

## Architecture Flow

```
User Request → Contract Records → Gateway Decryption → Callback Completion
     ↓              ↓                    ↓                    ↓
  Encrypted    Store with FHE      Async Process       Update State
    Data        Permissions          Request           Emit Events
```

## Core Components

### 1. Gateway Callback Pattern

The contract uses FHEVM's Gateway for asynchronous decryption:

```solidity
// 1. Submit encrypted request
function requestAmountDecryption(uint32 _violationId)
    → requestId = FHE.requestDecryption(cts, callback.selector)

// 2. Gateway processes and calls back
function amountDecryptionCallback(requestId, cleartexts, proof)
    → FHE.checkSignatures(requestId, cleartexts, proof)
    → Update state with revealed values
```

### 2. Timeout Protection

Prevents permanent fund locking if decryption fails:

```solidity
DECRYPTION_TIMEOUT = 1 hour

function claimTimeoutRefund(violationId)
    - Check: decryptionRequestTime + TIMEOUT < block.timestamp
    - Check: callback not completed
    - Refund user funds
```

### 3. Privacy Protection Mechanisms

#### Random Multiplier (Division Attack Prevention)
```solidity
PRIVACY_MULTIPLIER = 1000

// Prevents inferring exact values through division
protectedAmount = scaledAmount * PRIVACY_MULTIPLIER
```

#### Price Obfuscation
```solidity
function _obfuscateAmount(baseAmount, isRepeat)
    - Add random noise: baseAmount + (random % baseAmount/10)
    - Public display only, actual amount is encrypted
```

## Security Measures

### Input Validation
- All user inputs validated before processing
- Violation type: 1-5 only
- Fine amounts: MIN_FINE to MAX_FINE
- Non-zero address checks

### Access Control
- `onlyOwner`: Administrative functions
- `onlyPauser`: Emergency pause
- `whenNotPaused`: Core operations
- Reporter/owner authorization for decryption requests

### Overflow Protection
- Using Solidity 0.8+ automatic checks
- Explicit `unchecked` blocks where safe
- BPS calculations prevent overflow

### Emergency Controls
- Pausable contract via pauser set
- Multi-pauser support for redundancy

## Gas Optimization (HCU)

### Efficient FHE Operations
```solidity
// Batch similar operations
euint64 multiplier = FHE.add(hundred, severity);
euint64 scaledAmount = FHE.mul(encryptedBase, multiplier);

// Single permission grant
FHE.allowThis(protectedAmount);
```

### Storage Optimization
- Use `uint32` for counters (not uint256)
- Packed structs where possible
- `unchecked` for safe arithmetic

## Events for Audit Trail

```solidity
ViolationReported(violationId, reporter, location, timestamp)
PaymentSubmitted(violationId, timestamp)
DecryptionRequested(violationId, requestId)
DecryptionCompleted(violationId, revealedAmount)
TimeoutRefund(violationId, recipient, amount)
ViolationProcessed(violationId, paymentConfirmed)
```

## State Machine

```
CREATED → DECRYPTION_REQUESTED → DECRYPTION_COMPLETED → PROCESSED
                    ↓
             TIMEOUT_REFUNDED
```

## Deployment Requirements

- FHEVM 0.8.0+
- SepoliaConfig for network configuration
- Gateway access for decryption callbacks
