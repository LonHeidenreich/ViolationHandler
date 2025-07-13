module.exports = {
  namedAccounts: {
    deployer: {
      default: 0, // First account by default
      1: 0,       // Mainnet
      11155111: 0, // Sepolia
      9000: 0,    // Local FHEVM
    },
    admin: {
      default: 1,
      11155111: 1,
    },
  },
};
