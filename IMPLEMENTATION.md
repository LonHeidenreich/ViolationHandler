# Anonymous Violation Handler - FHE Implementation Guide

## Overview

This document details the Fully Homomorphic Encryption (FHE) implementation for the Anonymous Violation Handler system, built according to Zama's FHE best practices and requirements.

## FHE Features Implemented

### 1. Multiple Encrypted Types (euint32, euint64, euint8, ebool)

The contract utilizes multiple FHE data types to demonstrate comprehensive encryption capabilities:

```solidity
struct Violation {
    euint32 encryptedLicenseHash;      // 32-bit encrypted license plate hash
    euint64 encryptedAmount;           // 64-bit encrypted fine amount
    euint8 encryptedViolationType;     // 8-bit encrypted violation category
    euint32 encryptedSeverityScore;    // 32-bit encrypted severity rating
    ebool encryptedIsRepeat;           // Encrypted boolean for repeat offender flag
    ...
}
```

**Purpose**: Different data types optimize gas costs while maintaining necessary precision.

### 2. Input Proof Verification (ZKPoK)

All encrypted inputs require zero-knowledge proofs of knowledge:

```solidity
function reportViolation(
    inEuint32 calldata _encryptedLicenseHash,
    inEuint8 calldata _violationType,
    inEuint32 calldata _severityScore,
    inEuint8 calldata _isRepeatOffender,
    string memory _location,
    bytes calldata inputProof  // ← ZKPoK proof
) external whenNotPaused
```

**Purpose**: Ensures encrypted data integrity and prevents malformed inputs.

### 3. Complex Encrypted Logic

The contract performs sophisticated encrypted computations:

```solidity
// Encrypted validation
ebool isValidType = FHE.and(
    FHE.ge(encryptedType, FHE.asEuint8(1)),
    FHE.le(encryptedType, FHE.asEuint8(5))
);

// Encrypted arithmetic with conditional logic
euint64 baseFine = FHE.asEuint64(150);
euint64 severityMultiplier = FHE.add(FHE.asEuint64(100), FHE.asEuint64(encryptedSeverity));
euint64 amountWithSeverity = FHE.div(FHE.mul(baseFine, severityMultiplier), FHE.asEuint64(100));

// Encrypted conditional selection
euint64 finalAmount = FHE.select(
    encryptedRepeat,
    FHE.mul(amountWithSeverity, FHE.asEuint64(2)),  // Double if repeat
    amountWithSeverity
);
```

**Operations Used**:
- `FHE.and()` - Logical AND
- `FHE.ge()`, `FHE.le()` - Comparison operators
- `FHE.add()`, `FHE.mul()`, `FHE.div()` - Arithmetic
- `FHE.select()` - Conditional selection
- `FHE.eq()` - Equality comparison

### 4. Gateway Integration for Decryption

Implements Zama Gateway for secure decryption with callbacks:

```solidity
function processPayment(uint32 _violationId) external onlyOwner {
    // Request decryption through Gateway
    uint256[] memory cts = new uint256[](1);
    cts[0] = Gateway.toUint256(payment.encryptedPaymentValid);

    uint256 requestId = Gateway.requestDecryption(
        cts,
        this.finalizePaymentCallback.selector,
        0,
        block.timestamp + 100,
        false
    );
}

// Gateway callback receives decrypted data
function finalizePaymentCallback(
    uint256 requestId,
    bool decryptedPaymentValid
) public onlyGateway {
    // Process decrypted result
}
```

**Purpose**: Asynchronous decryption for verification while maintaining privacy.

### 5. Fail-Closed Design

All operations fail by default if conditions aren't met:

```solidity
// Custom errors for explicit failure modes
error InvalidViolationType();
error AlreadyPaid();
error InvalidProof();

// Fail-closed validation
if (bytes(_location).length == 0) revert LocationRequired();
if (violations[_violationId].isPaid) revert AlreadyPaid();
```

**Purpose**: Security-first approach prevents unauthorized operations.

### 6. PauserSet Mechanism

Multi-pauser emergency control system:

```solidity
mapping(address => bool) public pausers;
uint256 public pauserCount;

function addPauser(address _pauser) external onlyOwner {
    if (pausers[_pauser]) revert AlreadyPauser();
    pausers[_pauser] = true;
    pauserCount++;
    emit PauserAdded(_pauser);
}

modifier onlyPauser() {
    if (!pausers[msg.sender]) revert NotAPauser();
    _;
}
```

**Purpose**: Distributed emergency controls with role-based access.

### 7. Access Control & Permissions

Comprehensive permission management for encrypted data:

```solidity
// Grant contract access to encrypted values
FHE.allowThis(encryptedLicense);
FHE.allowThis(finalAmount);
FHE.allowThis(encryptedType);
FHE.allowThis(encryptedSeverity);
FHE.allowThis(encryptedRepeat);
```

**Purpose**: Explicit permission grants for FHE operations.

### 8. Event Logging

Complete audit trail for transparency:

```solidity
event ViolationReported(uint32 indexed violationId, address indexed reporter, string location);
event PaymentSubmitted(uint32 indexed violationId, uint256 timestamp);
event DecryptionRequested(uint32 indexed violationId, uint256 requestId);
event DecryptionCallbackReceived(uint32 indexed violationId, uint256 requestId);
```

## Multi-Contract Architecture

### ViolationRegistry.sol

Supporting contract for violation type management:

- Manages violation metadata
- Tracks violation statistics
- Provides type validation
- Separate ownership and permissions

**Benefits**:
- Modular design
- Gas optimization
- Easier upgrades
- Clear separation of concerns

## Development Setup

### Prerequisites

```bash
npm install
```

### Configuration Files

1. **hardhat.config.ts**: Hardhat setup with FHEVM plugin
2. **tsconfig.json**: TypeScript strict mode enabled
3. **.env**: Network and API configurations

### Key Dependencies

- `@fhevm/solidity`: FHE cryptographic operations
- `@fhevm/hardhat-plugin`: Hardhat integration
- `fhevmjs`: Client-side encryption library
- `hardhat-contract-sizer`: Monitor contract sizes
- `hardhat-deploy`: Deployment management

## Testing

Run comprehensive test suite:

```bash
npm run test
```

**Test Coverage**:
- Access control (onlyOwner, onlyPauser, whenNotPaused)
- PauserSet mechanism
- Edge cases and boundary conditions
- Error handling
- Permission management
- Multi-contract interaction

## Deployment

### Local FHEVM

```bash
npm run deploy:local
```

### Sepolia Testnet

```bash
npm run deploy
```

### Contract Size Analysis

```bash
npm run size
```

## Gas Optimization Strategies

1. **Packed Storage**: Efficient struct layouts
2. **Batch Operations**: Combined permission grants
3. **View Functions**: Off-chain data access
4. **Event Indexing**: Optimized log queries
5. **Minimal Storage**: Essential data only

## Security Considerations

### Input Validation

- All encrypted inputs require proofs
- Type checking on all parameters
- Range validation for violation types
- Non-empty string requirements

### Access Patterns

- Owner: Administrative functions
- Pauser: Emergency controls
- Reporter: Violation submission
- Public: View functions only

### Encrypted Data Handling

- No direct access to encrypted values
- Permission-based FHE operations
- Gateway-only decryption
- Callback authentication

## Frontend Integration

### Using fhevmjs

```javascript
import { createInstance } from "fhevmjs";

// Initialize FHE instance
const instance = await createInstance({
  chainId: 11155111,
  publicKey: GATEWAY_PUBLIC_KEY
});

// Encrypt data
const encryptedLicense = instance.encrypt32(licenseHash);
const encryptedType = instance.encrypt8(violationType);

// Generate proof
const inputProof = await instance.generateProof();

// Submit transaction
await contract.reportViolation(
  encryptedLicense,
  encryptedType,
  encryptedSeverity,
  encryptedRepeat,
  location,
  inputProof
);
```

## Production Considerations

1. **Gateway Configuration**: Deploy and configure Zama Gateway
2. **Key Management**: Secure private key storage
3. **Gas Limits**: Set appropriate callback gas limits
4. **Monitoring**: Track decryption request statuses
5. **Rate Limiting**: Implement frontend throttling
6. **Error Handling**: Graceful failure recovery

## Compliance & Privacy

- **GDPR Compatible**: No personal data on-chain
- **Anonymous by Design**: Encrypted identifiers only
- **Audit Trail**: Complete transaction history
- **Right to Erasure**: Off-chain data deletion
- **Data Minimization**: Essential information only

## Future Enhancements

1. **Multi-sig Governance**: Decentralized administration
2. **Encrypted Appeals**: Privacy-preserving dispute resolution
3. **Advanced Analytics**: Encrypted data aggregation
4. **Cross-chain Support**: Multi-network deployment
5. **Mobile Integration**: Native app support

## Resources

- [Zama Documentation](https://docs.zama.ai/)
- [FHEVM Solidity](https://github.com/zama-ai/fhevm)
- [fhevmjs Library](https://github.com/zama-ai/fhevmjs)
- [Hardhat Plugin](https://github.com/zama-ai/fhevm-hardhat-plugin)

## License

MIT License - See LICENSE file for details

---

**Built with Zama FHEVM** - Privacy-preserving smart contracts using Fully Homomorphic Encryption
