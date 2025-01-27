import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // First deploy a test ERC20 token
  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = await TestToken.deploy("Test USDC", "TUSDC");
  await testToken.deployed();
  console.log("TestToken (TUSDC) deployed to:", testToken.address);

  // Deploy OrderBookWithETH
  const OrderBookWithETH = await ethers.getContractFactory("OrderBookWithETH");
  const orderBook = await OrderBookWithETH.deploy();
  await orderBook.deployed();
  console.log("OrderBookWithETH deployed to:", orderBook.address);

  // Mint some test tokens
  const mintAmount = ethers.utils.parseEther("1000");
  await testToken.mint(deployer.address, mintAmount);
  console.log("Minted", ethers.utils.formatEther(mintAmount), "TUSDC to", deployer.address);

  // Approve OrderBook to spend tokens
  await testToken.approve(orderBook.address, mintAmount);
  console.log("Approved OrderBook to spend TUSDC");

  // Test Case 1: Create order with ETH for TUSDC
  const ethAmount = ethers.utils.parseEther("0.1");
  const tokenAmount = ethers.utils.parseEther("100");
  
  console.log("\nTest Case 1: Creating order with ETH for TUSDC");
  const tx1 = await orderBook.createOrderWithETH(
    testToken.address,
    tokenAmount,
    { value: ethAmount }
  );
  const receipt1 = await tx1.wait();
  const orderId1 = receipt1.events?.find(e => e.event === "OrderCreated")?.args?.orderId;
  console.log("Created order", orderId1.toString(), "- Offering", ethers.utils.formatEther(ethAmount), "ETH for", ethers.utils.formatEther(tokenAmount), "TUSDC");

  // Test Case 2: Create order with TUSDC for ETH
  console.log("\nTest Case 2: Creating order with TUSDC for ETH");
  const tx2 = await orderBook.createOrderForETH(
    testToken.address,
    tokenAmount,
    ethAmount
  );
  const receipt2 = await tx2.wait();
  const orderId2 = receipt2.events?.find(e => e.event === "OrderCreated")?.args?.orderId;
  console.log("Created order", orderId2.toString(), "- Offering", ethers.utils.formatEther(tokenAmount), "TUSDC for", ethers.utils.formatEther(ethAmount), "ETH");

  console.log("\nTest deployment and order creation completed successfully!");
  console.log("OrderBook address:", orderBook.address);
  console.log("TestToken (TUSDC) address:", testToken.address);
  console.log("\nYou can now test filling these orders using a different account.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
