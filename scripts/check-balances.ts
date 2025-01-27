import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Checking balances for account:", deployer.address);

  // Get ETH balance
  const ethBalance = await deployer.getBalance();
  console.log("ETH balance:", ethers.utils.formatEther(ethBalance), "ETH");

  // Get TUSDC balance
  const testTokenAddress = "0x1Fec12865acA0c259FD79ac6CA1B31c2018970C4"; // From previous deployment
  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = TestToken.attach(testTokenAddress);
  
  const tusdcBalance = await testToken.balanceOf(deployer.address);
  console.log("TUSDC balance:", ethers.utils.formatEther(tusdcBalance), "TUSDC");

  // Get contract balances
  const orderBookAddress = "0x68C48cd6F32907e93F2c9652c10DF68242600459"; // From previous deployment
  const contractEthBalance = await ethers.provider.getBalance(orderBookAddress);
  const contractTusdcBalance = await testToken.balanceOf(orderBookAddress);
  
  console.log("\nOrderBook Contract Balances:");
  console.log("ETH balance:", ethers.utils.formatEther(contractEthBalance), "ETH");
  console.log("TUSDC balance:", ethers.utils.formatEther(contractTusdcBalance), "TUSDC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
