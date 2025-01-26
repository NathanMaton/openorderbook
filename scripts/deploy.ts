import { ethers } from "hardhat";

async function main() {
  const OrderBook = await ethers.getContractFactory("OrderBook");
  const orderBook = await OrderBook.deploy();

  await orderBook.deployed();

  console.log(`OrderBook deployed to ${orderBook.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
