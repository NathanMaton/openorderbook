import { ethers } from "hardhat";
import { verify } from "./verify";

// USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

async function main() {
    console.log("Deploying OrderBookWithETH to Base mainnet...");
    
    const OrderBookWithETH = await ethers.getContractFactory("OrderBookWithETH");
    const orderBook = await OrderBookWithETH.deploy();

    await orderBook.deployed();

    console.log(`OrderBookWithETH deployed to ${orderBook.address}`);
    
    // Wait for a few block confirmations
    console.log("Waiting for block confirmations...");
    await orderBook.deployTransaction.wait(5);
    
    // Verify the contract
    console.log("Verifying contract on Basescan...");
    await verify(orderBook.address, []);
    
    console.log("\nDeployment Summary:");
    console.log("-------------------");
    console.log(`OrderBook Address: ${orderBook.address}`);
    console.log(`USDC Address: ${USDC_ADDRESS}`);
    console.log(`Network: Base Mainnet`);
    console.log(`Block Number: ${await ethers.provider.getBlockNumber()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
