import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const OrderBookWithETH = await ethers.getContractFactory("OrderBookWithETH");
  const orderBook = await OrderBookWithETH.deploy();
  await orderBook.deployed();

  console.log("OrderBookWithETH deployed to:", orderBook.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
