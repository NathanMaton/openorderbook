// Helper script to make console interaction easier
import { ethers } from "hardhat";

async function setupContracts() {
    // Get the OrderBook contract
    const orderBook = await ethers.getContractAt("OrderBook", "0x81F9C31C5E6B130B2EE94143ba7C4898B4c686Db");
    
    // Deploy test tokens
    const TestToken = await ethers.getContractFactory("TestToken");
    const tokenA = await TestToken.deploy("Test Token A", "TTA");
    const tokenB = await TestToken.deploy("Test Token B", "TTB");
    
    await tokenA.deployed();
    await tokenB.deployed();
    
    console.log({
        orderBook: orderBook.address,
        tokenA: tokenA.address,
        tokenB: tokenB.address
    });
    
    // Return the contracts so they're available in the console
    return {
        orderBook,
        tokenA,
        tokenB,
        parseEther: ethers.utils.parseEther,
        formatEther: ethers.utils.formatEther
    };
}

// This will be available in the console as `setup()`
global.setup = setupContracts;
