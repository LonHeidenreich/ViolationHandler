# CI/CD Pipeline Documentation

## Overview

This project implements a comprehensive CI/CD pipeline using GitHub Actions with automated testing, code quality checks, security audits, and deployment workflows.

## Workflows

### 1. CI/CD Pipeline (`test.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### Lint Job
- **Purpose**: Code quality and linting checks
- **Steps**:
  - Runs Solhint on smart contracts
  - Runs ESLint on TypeScript/JavaScript files
  - Checks TypeScript types
- **Continue on Error**: Yes (warnings don't fail the build)

#### Test Job
- **Purpose**: Smart contract testing
- **Node Versions**: 18.x, 20.x (matrix)
- **Steps**:
  - Install dependencies
  - Compile contracts
  - Run test suite
  - Generate coverage report
  - Upload coverage to Codecov
- **Coverage Target**: 80% for project, 70% for patches

#### Contract Size Check
- **Purpose**: Monitor contract deployment sizes
- **Steps**:
  - Compile contracts
  - Generate size report
  - Ensure contracts are within size limits

#### Gas Report
- **Purpose**: Track gas usage optimization
- **Steps**:
  - Run tests with gas reporting enabled
  - Generate gas consumption report
  - Upload report as artifact (30-day retention)

#### Frontend Build
- **Purpose**: Verify Next.js application builds successfully
- **Steps**:
  - Install dependencies
  - Build Next.js application
  - Upload build artifacts (7-day retention)

#### Security Scan
- **Purpose**: Identify security vulnerabilities
- **Tools**:
  - npm audit (dependency vulnerabilities)
  - Slither (smart contract security analysis)
- **Continue on Error**: Yes (for informational purposes)

#### Summary
- **Purpose**: Aggregate all job results
- **Runs**: Always (even if previous jobs fail)
- **Output**: Status of all CI/CD jobs

### 2. Deployment Pipeline (`deploy.yml`)

**Triggers:**
- Push to version tags (`v*`)
- Manual workflow dispatch

**Jobs:**

#### Deploy Contracts
- **Environment**: Production
- **Steps**:
  - Compile contracts
  - Deploy to Sepolia testnet
  - Save deployment information
- **Secrets Required**:
  - `SEPOLIA_RPC_URL`
  - `PRIVATE_KEY`
  - `ETHERSCAN_API_KEY`

#### Deploy Frontend
- **Depends On**: deploy-contracts
- **Platform**: Vercel
- **Steps**:
  - Build Next.js application
  - Deploy to Vercel production
- **Secrets Required**:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
  - `WALLETCONNECT_PROJECT_ID`
  - `CONTRACT_ADDRESS`

## Code Quality Tools

### Solhint
- **Config**: `.solhint.json`
- **Extends**: `solhint:recommended`
- **Custom Rules**:
  - Compiler version: ^0.8.0
  - Max line length: 120
  - Custom errors enforced
  - Gas optimization checks
- **Run**: `npm run lint:sol`
- **Auto-fix**: `npm run lint:fix`

### ESLint
- **Config**: Next.js defaults
- **Run**: `npm run lint`

### TypeScript
- **Check**: `npx tsc --noEmit`
- **Strict Mode**: Enabled

## Coverage Reporting

### Codecov Integration
- **Config**: `codecov.yml`
- **Coverage Targets**:
  - Project: 80% (threshold: 2%)
  - Patch: 70% (threshold: 5%)
- **Features**:
  - Automatic PR comments
  - Coverage diff visualization
  - Flag-based reporting

### Generating Coverage Locally
```bash
npm run coverage
```

Coverage report will be generated in:
- HTML: `coverage/index.html`
- LCOV: `coverage/lcov.info`
- JSON: `coverage/coverage.json`

## Required GitHub Secrets

### For CI/CD
```
CODECOV_TOKEN              # Codecov upload token
```

### For Deployment
```
SEPOLIA_RPC_URL           # Sepolia RPC endpoint
PRIVATE_KEY               # Deployment wallet private key
ETHERSCAN_API_KEY         # Etherscan verification API key
VERCEL_TOKEN              # Vercel deployment token
VERCEL_ORG_ID             # Vercel organization ID
VERCEL_PROJECT_ID         # Vercel project ID
WALLETCONNECT_PROJECT_ID  # WalletConnect cloud project ID
CONTRACT_ADDRESS          # Deployed contract address
```

## Setting Up Secrets

1. Navigate to GitHub repository settings
2. Go to "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Add each secret with the appropriate value

### Getting Tokens

#### Codecov Token
1. Visit https://codecov.io/
2. Sign in with GitHub
3. Add your repository
4. Copy the upload token

#### Vercel Token
1. Visit https://vercel.com/account/tokens
2. Create new token
3. Copy token value

#### Vercel Project Info
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Get project info
cat .vercel/project.json
```

## Badges

Add these badges to your README.md:

```markdown
![CI/CD](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/CI%2FCD%20Pipeline/badge.svg)
![Coverage](https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO/branch/main/graph/badge.svg)
![License](https://img.shields.io/github/license/YOUR_USERNAME/YOUR_REPO)
```

## Workflow Status

### Viewing Workflow Runs
1. Go to repository → Actions tab
2. Select workflow from left sidebar
3. Click on specific run to see details

### Debugging Failed Workflows
1. Check job logs for error messages
2. Re-run failed jobs if transient
3. Review code changes that triggered failure
4. Check secret configuration

## Local Testing

Before pushing, test locally:

```bash
# Lint contracts
npm run lint:sol

# Lint TypeScript
npm run lint

# Run tests
npm test

# Generate coverage
npm run coverage

# Check contract sizes
npm run size

# Build frontend
npm run build
```

## Continuous Integration Best Practices

1. **Commit Often**: Small, focused commits
2. **Test Locally**: Run tests before pushing
3. **Write Tests**: Maintain >80% coverage
4. **Fix Warnings**: Don't accumulate technical debt
5. **Review Logs**: Check CI logs even on success
6. **Update Dependencies**: Keep packages current
7. **Monitor Gas**: Track gas usage trends
8. **Security First**: Address audit findings immediately

## Performance Optimization

### Cache Strategy
- npm packages cached by Node.js version
- Hardhat artifacts cached between runs
- Next.js build cache enabled

### Parallel Execution
- Lint jobs run independently
- Test matrix runs in parallel
- Independent security scans

### Artifact Management
- Gas reports: 30-day retention
- Build artifacts: 7-day retention
- Deployment info: 90-day retention

## Troubleshooting

### Common Issues

**Issue**: Tests fail on CI but pass locally
**Solution**: Check Node.js version, clear cache, verify environment variables

**Issue**: Coverage upload fails
**Solution**: Verify CODECOV_TOKEN secret, check coverage file generation

**Issue**: Deployment fails
**Solution**: Verify all required secrets are set, check network connectivity

**Issue**: Solhint errors on CI
**Solution**: Run `npm run lint:sol` locally, fix issues, commit

**Issue**: Out of gas on deployment
**Solution**: Optimize contracts, reduce deployment size, check gas price

## Monitoring

### What to Monitor
- Test pass rate
- Coverage trends
- Gas usage trends
- Build times
- Deployment success rate
- Security scan results

### Setting Up Alerts
1. GitHub: Settings → Notifications
2. Enable workflow failure notifications
3. Configure email/Slack integration

## Future Enhancements

- [ ] Add Echidna fuzzing tests
- [ ] Integrate Certora formal verification
- [ ] Add performance benchmarking
- [ ] Set up automated dependency updates (Dependabot)
- [ ] Add E2E testing workflow
- [ ] Implement staging environment
- [ ] Add load testing for frontend
- [ ] Set up monitoring dashboards

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Hardhat Testing](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)
- [Codecov Documentation](https://docs.codecov.com/)
- [Solhint Rules](https://github.com/protofire/solhint/blob/master/docs/rules.md)
- [Vercel Deployment](https://vercel.com/docs/deployments/overview)

---

**Last Updated**: 2025-10-23
**Pipeline Version**: 1.0.0
**Status**: Active
