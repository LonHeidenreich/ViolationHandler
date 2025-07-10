export const CONTRACT_ADDRESS = '0x4db282A151AbfF62B27FF3032003118Ee58Ed0E8' as const;

export const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AlreadyPaid",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AlreadyPauser",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AlreadyProcessed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AmountMustBePositive",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ContractPaused",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidViolationId",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidViolationType",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "LocationRequired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotAPauser",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Unauthorized",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "violationType",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newAmount",
        "type": "uint256"
      }
    ],
    "name": "FineAmountUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "pauser",
        "type": "address"
      }
    ],
    "name": "PauserAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "pauser",
        "type": "address"
      }
    ],
    "name": "PauserRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint32",
        "name": "violationId",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "PaymentSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint32",
        "name": "violationId",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "paymentConfirmed",
        "type": "bool"
      }
    ],
    "name": "ViolationProcessed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint32",
        "name": "violationId",
        "type": "uint32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "reporter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "location",
        "type": "string"
      }
    ],
    "name": "ViolationReported",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_pauser",
        "type": "address"
      }
    ],
    "name": "addPauser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "_violationType",
        "type": "uint8"
      }
    ],
    "name": "getBaseFine",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "_violationId",
        "type": "uint32"
      }
    ],
    "name": "getPaymentStatus",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "verified",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_reporter",
        "type": "address"
      }
    ],
    "name": "getReporterViolations",
    "outputs": [
      {
        "internalType": "uint32[]",
        "name": "",
        "type": "uint32[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalViolations",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "_violationId",
        "type": "uint32"
      }
    ],
    "name": "getViolationInfo",
    "outputs": [
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isPaid",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isProcessed",
        "type": "bool"
      },
      {
        "internalType": "address",
        "name": "reporter",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "violationType",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_address",
        "type": "address"
      }
    ],
    "name": "isPauser",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pauserCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "pausers",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "_violationId",
        "type": "uint32"
      }
    ],
    "name": "processPayment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_pauser",
        "type": "address"
      }
    ],
    "name": "removePauser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_licensePlate",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "_violationType",
        "type": "uint8"
      },
      {
        "internalType": "uint32",
        "name": "_severityScore",
        "type": "uint32"
      },
      {
        "internalType": "bool",
        "name": "_isRepeatOffender",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "_location",
        "type": "string"
      }
    ],
    "name": "reportViolation",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "_violationId",
        "type": "uint32"
      },
      {
        "internalType": "bytes32",
        "name": "_paymentId",
        "type": "bytes32"
      }
    ],
    "name": "submitPayment",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "togglePause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "_violationType",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "_newAmount",
        "type": "uint256"
      }
    ],
    "name": "updateViolationFine",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "violationCounter",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
] as const;

export const VIOLATION_TYPES = [
  { id: 1, name: 'Speeding', description: 'Exceeding speed limit' },
  { id: 2, name: 'Illegal Parking', description: 'Parking in restricted area' },
  { id: 3, name: 'Red Light', description: 'Running a red light' },
  { id: 4, name: 'No Seatbelt', description: 'Not wearing seatbelt' },
  { id: 5, name: 'Mobile Phone', description: 'Using phone while driving' },
] as const;
