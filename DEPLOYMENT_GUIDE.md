# Deployment Guide - Anonymous Violation Handler

## Overview

This guide provides step-by-step instructions for deploying and managing the Anonymous Violation Handler smart contracts using Hardhat.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Steps](#deployment-steps)
4. [Contract Verification](#contract-verification)
5. [Testing & Interaction](#testing--interaction)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js**: v18 or higher
- **npm**: v8 or higher
- **Git**: Latest version

### Required Accounts
- **Ethereum Wallet**: MetaMask or similar with private key
- **Etherscan Account**: For contract verification ([Sign up here](https://etherscan.io/register))
- **Sepolia Testnet ETH**: At least 0.1 ETH ([Get from faucet](https://sepoliafaucet.com/))

### Check Your Setup

```bash
# Check Node.js version
node --version  # Should be v18+

# Check npm version
npm --version   # Should be v8+

# Check if git is installed
git --version
```

---

## Environment Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/LonHeidenreich/AnonymousViolationHandler.git
cd AnonymousViolationHandler

# Install dependencies
npm install
```

### Step 2: Configure Environment Variables

```bash
# Copy the example .env file
cp .env.example .env
```

Edit `.env` file with your credentials:

```env
# Network Configuration
SEPOLIA_RPC_URL=https://rpc.sepolia.org
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# Etherscan API Key for Contract Verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Optional: Gas Reporter
REPORT_GAS=false
```

**IMPORTANT SECURITY NOTES:**
- Never commit your `.env` file to git
- Never share your private key
- Use a dedicated wallet for development/testing
- Ensure `.env` is listed in `.gitignore`

### Step 3: Get Your Private Key

**From MetaMask:**
1. Open MetaMask
2. Click the three dots menu
3. Select "Account Details"
4. Click "Export Private Key"
5. Enter your password
6. Copy the private key (without the 0x prefix)

### Step 4: Get Etherscan API Key

1. Visit [https://etherscan.io/](https://etherscan.io/)
2. Sign in or create an account
3. Go to "API Keys" section
4. Create a new API key
5. Copy the API key to your `.env` file

### Step 5: Get Sepolia Testnet ETH

Use these faucets to get test ETH:
- [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

You'll need at least 0.1 ETH for deployment and testing.

---

## Deployment Steps

### Step 1: Compile Contracts

```bash
# Compile smart contracts
npm run compile
```

Expected output:
```
Compiled 2 Solidity files successfully
```

### Step 2: Deploy to Sepolia

```bash
# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

**What happens during deployment:**
1. Connects to Sepolia network
2. Deploys `ViolationRegistry` contract
3. Deploys `AnonymousViolationHandler` contract
4. Initializes contracts with default settings
5. Saves deployment info to `deployments/sepolia-latest.json`

**Expected output:**
```
========================================
Anonymous Violation Handler Deployment
========================================

📡 Network: sepolia
📡 Chain ID: 11155111

👤 Deployer: 0x...
💰 Balance: X.XX ETH

📝 Step 1: Deploying ViolationRegistry...
✅ ViolationRegistry deployed to: 0x...

📝 Step 2: Deploying AnonymousViolationHandler...
✅ AnonymousViolationHandler deployed to: 0x...

========================================
🎉 Deployment Summary
========================================
Network:                  sepolia
ViolationRegistry:        0x...
AnonymousViolationHandler: 0x...
========================================
```

**IMPORTANT:** Save the contract addresses displayed in the deployment summary!

### Step 3: Verify Deployment

Check deployment information:

```bash
# View deployment info
cat deployments/sepolia-latest.json
```

This file contains:
- Contract addresses
- Network information
- Deployer address
- Timestamp
- Constructor arguments

---

## Contract Verification

Verify your contracts on Etherscan to make them publicly verifiable.

### Run Verification Script

```bash
npx hardhat run scripts/verify.js --network sepolia
```

**What happens:**
1. Loads deployment info from `deployments/sepolia-latest.json`
2. Verifies `ViolationRegistry` on Etherscan
3. Verifies `AnonymousViolationHandler` on Etherscan
4. Provides Etherscan links

**Expected output:**
```
========================================
Contract Verification on Etherscan
========================================

📝 Step 1: Verifying ViolationRegistry...
✅ ViolationRegistry verified successfully

📝 Step 2: Verifying AnonymousViolationHandler...
✅ AnonymousViolationHandler verified successfully

========================================
✅ Verification Complete
========================================
```

### Manual Verification (if automatic fails)

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

---

## Testing & Interaction

### Interact with Deployed Contracts

```bash
npx hardhat run scripts/interact.js --network sepolia
```

**What this does:**
- Connects to deployed contracts
- Checks contract status (owner, total violations, paused state)
- Displays violation fine structure
- Queries existing violations
- Shows your reported violations
- Provides usage examples

### Run Simulation

```bash
npx hardhat run scripts/simulate.js --network sepolia
```

**What this does:**
- Demonstrates violation reporting workflow
- Shows payment submission process
- Tests owner functions
- Provides implementation examples

**Note:** Full FHE implementation requires additional setup with `fhevmjs` library.

---

## Deployment Information

### Current Deployment (Sepolia)

**Network**: Sepolia Testnet
**Chain ID**: 11155111

**Contract Addresses:**
- **AnonymousViolationHandler**: `0xaa6C1DdBd17F6e8baE8A5cb4eB015e7ed34AE3b1`
- **Etherscan**: [View Contract](https://sepolia.etherscan.io/address/0xaa6C1DdBd17F6e8baE8A5cb4eB015e7ed34AE3b1)

### Deployment Artifacts

All deployment information is saved in the `deployments/` directory:

```
deployments/
├── sepolia-latest.json          # Latest deployment info
└── sepolia-[timestamp].json     # Historical deployments
```

Each file contains:
```json
{
  "network": "sepolia",
  "chainId": "11155111",
  "deployer": "0x...",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "contracts": {
    "ViolationRegistry": {
      "address": "0x...",
      "constructorArgs": []
    },
    "AnonymousViolationHandler": {
      "address": "0x...",
      "constructorArgs": []
    }
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. "Insufficient funds for gas"

**Problem**: Not enough ETH in wallet
**Solution**: Get more Sepolia ETH from faucets

#### 2. "Invalid API Key"

**Problem**: Etherscan API key not set or invalid
**Solution**: Check your `.env` file and verify API key on Etherscan

#### 3. "Contract already verified"

**Problem**: Trying to verify an already verified contract
**Solution**: This is not an error - the contract is already verified on Etherscan

#### 4. "Network connection timeout"

**Problem**: RPC endpoint not responding
**Solution**: Try alternative RPC endpoints:
```env
# Alternative Sepolia RPCs
SEPOLIA_RPC_URL=https://ethereum-sepolia.publicnode.com
SEPOLIA_RPC_URL=https://rpc2.sepolia.org
```

#### 5. "Missing .env file"

**Problem**: Environment variables not configured
**Solution**:
```bash
cp .env.example .env
# Edit .env with your credentials
```

#### 6. "Cannot find module 'hardhat'"

**Problem**: Dependencies not installed
**Solution**:
```bash
npm install
```

### Gas Optimization

If gas costs are too high:

1. **Reduce optimizer runs** (in `hardhat.config.ts`):
```typescript
optimizer: {
  enabled: true,
  runs: 100  // Lower for deployment, higher for runtime
}
```

2. **Use gas reporter** to identify expensive functions:
```bash
REPORT_GAS=true npm run test
```

### Getting Help

If you encounter other issues:

1. Check the [Hardhat documentation](https://hardhat.org/docs)
2. Review [Etherscan verification docs](https://docs.etherscan.io/tutorials/verifying-contracts-programmatically)
3. Search for similar issues on [Stack Exchange](https://ethereum.stackexchange.com/)
4. Create an issue on the [GitHub repository](https://github.com/LonHeidenreich/AnonymousViolationHandler/issues)

---

## Advanced Usage

### Deploy to Local Network

```bash
# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Deploy to local network
npx hardhat run scripts/deploy.js --network localhost
```

### Run Tests

```bash
# Run all tests
npm run test

# Run with gas reporting
REPORT_GAS=true npm run test

# Run coverage
npx hardhat coverage
```

### Contract Size Check

```bash
npm run size
```

---

## Security Checklist

Before deploying to mainnet:

- [ ] All tests pass
- [ ] Code has been audited
- [ ] `.env` file is in `.gitignore`
- [ ] Private keys are stored securely
- [ ] Contract ownership is properly configured
- [ ] Emergency pause mechanism tested
- [ ] Gas optimization reviewed
- [ ] Access controls verified
- [ ] Event emissions confirmed
- [ ] Documentation is complete

---

## Next Steps

After successful deployment:

1. **Update Frontend**: Update contract address in `public/index.html`
2. **Test Thoroughly**: Use `interact.js` and `simulate.js` scripts
3. **Monitor Transactions**: Check Etherscan for all transactions
4. **Document Deployment**: Keep records of all contract addresses
5. **Set Up Monitoring**: Consider using tools like Tenderly or Defender

---

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Sepolia Testnet Info](https://sepolia.dev/)
- [FHE.vm Documentation](https://docs.fhevm.io/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

---

## Support

For questions or issues:
- GitHub: [Open an issue](https://github.com/LonHeidenreich/AnonymousViolationHandler/issues)
- Email: Contact repository maintainer

---

**Last Updated**: 2024
**Version**: 1.0.0
