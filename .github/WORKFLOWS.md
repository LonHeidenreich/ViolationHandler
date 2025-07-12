# GitHub Actions Workflows

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CODE PUSH / PULL REQUEST                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    CI/CD PIPELINE (test.yml)                 │
├──────────────┬────────────┬───────────┬──────────┬──────────┤
│              │            │           │          │          │
▼              ▼            ▼           ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Lint   │ │ Test   │ │Contract │ │  Gas   │ │Frontend│ │Security│
│        │ │ (18.x) │ │  Size   │ │ Report │ │ Build  │ │  Scan  │
│        │ │ (20.x) │ │         │ │        │ │        │ │        │
└───┬────┘ └───┬────┘ └────┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
    │          │           │          │          │          │
    └──────────┴───────────┴──────────┴──────────┴──────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Summary    │
                    └──────────────┘
```

## Job Flow Details

### Lint Job
```
┌─────────────────────────────┐
│      Lint Job Start         │
├─────────────────────────────┤
│ 1. Checkout code            │
│ 2. Setup Node.js 20.x       │
│ 3. Install dependencies     │
│ 4. Run Solhint              │
│ 5. Run ESLint               │
│ 6. Check TypeScript types   │
└─────────────────────────────┘
        │
        ▼
  ✓ Complete (warnings OK)
```

### Test Job (Matrix)
```
┌────────────────────┐     ┌────────────────────┐
│   Node.js 18.x     │     │   Node.js 20.x     │
├────────────────────┤     ├────────────────────┤
│ 1. Checkout        │     │ 1. Checkout        │
│ 2. Setup Node      │     │ 2. Setup Node      │
│ 3. Install deps    │     │ 3. Install deps    │
│ 4. Compile         │     │ 4. Compile         │
│ 5. Run tests       │     │ 5. Run tests       │
│ 6. Coverage        │     │ 6. Coverage        │
│ 7. (skip Codecov)  │     │ 7. Upload Codecov  │
└────────────────────┘     └────────────────────┘
        │                           │
        └───────────┬───────────────┘
                    ▼
             ✓ Both pass
```

### Contract Size Check
```
┌─────────────────────────────┐
│  Contract Size Check        │
├─────────────────────────────┤
│ 1. Checkout code            │
│ 2. Setup Node.js            │
│ 3. Install dependencies     │
│ 4. Run hardhat size         │
│ 5. Check limits             │
└─────────────────────────────┘
        │
        ▼
  ✓ Size within limits
```

### Gas Report
```
┌─────────────────────────────┐
│      Gas Report             │
├─────────────────────────────┤
│ 1. Checkout code            │
│ 2. Setup Node.js            │
│ 3. Install dependencies     │
│ 4. Run tests with REPORT_GAS│
│ 5. Generate report          │
│ 6. Upload artifact (30d)    │
└─────────────────────────────┘
        │
        ▼
  ✓ Report saved
```

### Frontend Build
```
┌─────────────────────────────┐
│    Frontend Build           │
├─────────────────────────────┤
│ 1. Checkout code            │
│ 2. Setup Node.js            │
│ 3. Install dependencies     │
│ 4. Build Next.js app        │
│ 5. Upload .next (7d)        │
└─────────────────────────────┘
        │
        ▼
  ✓ Build successful
```

### Security Scan
```
┌─────────────────────────────┐
│    Security Scan            │
├─────────────────────────────┤
│ 1. Checkout code            │
│ 2. Setup Node.js            │
│ 3. Install dependencies     │
│ 4. Run npm audit            │
│ 5. Run Slither              │
└─────────────────────────────┘
        │
        ▼
  ✓ Scan complete (warnings OK)
```

## Deployment Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    VERSION TAG PUSH (v*)                     │
│                   OR MANUAL TRIGGER                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                DEPLOYMENT PIPELINE (deploy.yml)              │
├────────────────────────┬────────────────────────────────────┤
│                        │                                     │
▼                        │                                     │
┌──────────────────────┐ │                                     │
│  Deploy Contracts    │ │                                     │
├──────────────────────┤ │                                     │
│ 1. Checkout          │ │                                     │
│ 2. Setup Node        │ │                                     │
│ 3. Install deps      │ │                                     │
│ 4. Compile contracts │ │                                     │
│ 5. Deploy to Sepolia │ │                                     │
│ 6. Save deployment   │ │                                     │
│ 7. Upload info (90d) │ │                                     │
└──────┬───────────────┘ │                                     │
       │                 │                                     │
       │ Success         │                                     │
       └─────────────────┘                                     │
                         │                                     │
                         ▼                                     │
               ┌──────────────────┐                            │
               │ Deploy Frontend  │                            │
               ├──────────────────┤                            │
               │ 1. Checkout      │                            │
               │ 2. Setup Node    │                            │
               │ 3. Install deps  │                            │
               │ 4. Build app     │                            │
               │ 5. Deploy Vercel │                            │
               └──────────────────┘                            │
                         │                                     │
                         ▼                                     │
                  ✓ Deployment Complete                        │
```

## Trigger Conditions

### test.yml Triggers
- **Push**: `main`, `develop` branches
- **Pull Request**: Any PR to `main` or `develop`

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

### deploy.yml Triggers
- **Tags**: Version tags starting with `v` (e.g., `v1.0.0`)
- **Manual**: Workflow dispatch button

```yaml
on:
  push:
    tags: ['v*']
  workflow_dispatch:
```

## Artifact Retention

| Artifact Type | Retention | Purpose |
|--------------|-----------|---------|
| Gas Reports | 30 days | Track gas optimization trends |
| Build Artifacts | 7 days | Debug build issues |
| Deployment Info | 90 days | Contract deployment history |

## Parallel vs Sequential Execution

### Parallel Jobs (Independent)
```
Lint ──────────┐
Test (18.x) ───┤
Test (20.x) ───┤
Contract Size ─┼──→ Run simultaneously
Gas Report ────┤
Frontend ──────┤
Security ──────┘
       │
       ▼
    Summary
```

### Sequential Jobs (Dependent)
```
Deploy Contracts ──→ Deploy Frontend
    (must succeed)       (depends on)
```

## Status Indicators

### ✅ Success
- All tests pass
- Linting passes (warnings OK)
- Build succeeds
- Coverage meets threshold

### ⚠️ Warning
- Linting warnings
- Security scan findings
- Low coverage (but above threshold)

### ❌ Failure
- Test failures
- Build errors
- Coverage below threshold (if strict)
- Deployment errors

## Environment Variables

### CI Environment
```bash
NODE_ENV=test              # Test environment
REPORT_GAS=true           # Enable gas reporting
CI=true                   # GitHub Actions flag
```

### Deployment Environment
```bash
SEPOLIA_RPC_URL           # RPC endpoint
PRIVATE_KEY               # Deployment key
ETHERSCAN_API_KEY         # Verification key
NEXT_PUBLIC_*             # Public env vars
```

## Notifications

### When Workflows Run
- Push notification to committer
- PR status checks updated
- Email on failure (configurable)

### Where to Check Status
1. GitHub Actions tab
2. PR checks section
3. Commit status indicators
4. Email notifications

## Best Practices

### Before Committing
```bash
npm run lint:sol          # Check contract linting
npm run lint              # Check TypeScript linting
npm test                  # Run tests locally
npm run build             # Verify build
```

### Creating a Release
```bash
git tag v1.0.0
git push origin v1.0.0
# Triggers deployment workflow
```

### Monitoring
- Check Actions tab regularly
- Review coverage trends
- Monitor gas usage
- Address security findings

## Troubleshooting

### Workflow Failed?
1. Check job logs
2. Identify failing step
3. Reproduce locally
4. Fix and push
5. Re-run workflow if transient

### Coverage Decreased?
1. Check Codecov report
2. Identify uncovered lines
3. Add missing tests
4. Push updated tests

### Deployment Failed?
1. Verify secrets are set
2. Check network connectivity
3. Review deployment logs
4. Check gas prices
5. Verify contract size

---

**Last Updated**: 2025-10-23
**Workflows**: 2 active
**Jobs**: 8 parallel + 2 sequential
**Status**: ✅ Operational
