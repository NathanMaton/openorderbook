import { ethers } from "hardhat";

async function main() {
    const OrderBookWithETH = await ethers.getContractFactory("OrderBookWithETH");
    const orderBook = await OrderBookWithETH.deploy();

    await orderBook.deployed();

    console.log(`OrderBookWithETH deployed to ${orderBook.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
