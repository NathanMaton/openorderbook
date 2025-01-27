# OpenOrderBook

A decentralized order book for trading ETH and ERC20 tokens on Base. The order book supports limit orders for ETH/USDC pairs with efficient order tracking and management.

## Features

- Create and fill orders with ETH or USDC
- Efficient order tracking and querying
- Support for order cancellation
- Real-time order status updates
- Gas-optimized operations

## Repository Structure

```
openorderbook/
├── contracts/                  # Smart contract source files
│   ├── OrderBookV2.sol        # Main order book contract
│   └── interfaces/            # Contract interfaces
├── scripts/                   # Deployment and interaction scripts
│   ├── deploy.ts             # Main deployment script
│   ├── deploy-base-mainnet.ts # Base mainnet deployment
│   ├── verify.ts             # Contract verification helper
│   └── examples/             # Example scripts and tests
│       ├── create-dollar-orders-mainnet.ts  # Create $1 test orders
│       ├── fill-order-mainnet.ts           # Fill specific orders
│       ├── test-orderbook-sepolia.ts       # Sepolia testnet examples
│       ├── transfer-usdc-mainnet.ts        # Token transfer examples
│       └── view-active-orders-mainnet.ts   # Query active orders
├── test/                     # Contract test files
└── hardhat.config.ts        # Hardhat configuration
```

## Contract Addresses

- Base Mainnet:
  - OrderBookV2: `0xC60232938000fDA18590C3578a92f0a56c039647`
  - USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your configuration:
```
PRIVATE_KEY=your_private_key
PRIVATE_KEY2=second_account_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

3. Deploy the contract:
```bash
npx hardhat run scripts/deploy-base-mainnet.ts --network base
```

## Example Scripts

The `scripts/examples/` directory contains various example scripts demonstrating how to:
- Create orders with ETH or USDC
- Fill existing orders
- Query active orders
- Transfer tokens
- Test contract functionality

To run an example script:
```bash
npx hardhat run scripts/examples/view-active-orders-mainnet.ts --network base
```

## Testing

Run the test suite:
```bash
npx hardhat test
```

## License

MIT
