# OpenOrderBook

A decentralized order book protocol on Ethereum that enables gas-efficient token swaps through a traditional order book model.

## Features
- Post limit orders for buying and selling tokens
- Fill existing orders with minimal gas costs
- On-chain order book with off-chain order matching
- ERC20 token support
- Gas-optimized smart contracts

## Technical Stack
- Solidity ^0.8.0
- Hardhat for development and testing
- OpenZeppelin for secure contract implementations
- TypeScript for testing and deployment scripts

## Installation

```bash
npm install
```

## Testing

```bash
npx hardhat test
```

## Deployment

```bash
npx hardhat run scripts/deploy.ts --network <network>
```
