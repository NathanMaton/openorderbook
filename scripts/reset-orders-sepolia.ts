import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Connect to existing contracts
  const orderBookAddress = "0x68C48cd6F32907e93F2c9652c10DF68242600459";
  const testTokenAddress = "0x1Fec12865acA0c259FD79ac6CA1B31c2018970C4";

  const OrderBookWithETH = await ethers.getContractFactory("OrderBookWithETH");
  const orderBook = OrderBookWithETH.attach(orderBookAddress);

  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = TestToken.attach(testTokenAddress);

  // Cancel existing orders
  console.log("\nCancelling existing orders...");
  try {
    const tx1 = await orderBook.cancelOrder(1);
    await tx1.wait();
    console.log("Cancelled order #1");
  } catch (e) {
    console.log("Error cancelling order #1:", e.message);
  }

  try {
    const tx2 = await orderBook.cancelOrder(2);
    await tx2.wait();
    console.log("Cancelled order #2");
  } catch (e) {
    console.log("Error cancelling order #2:", e.message);
  }

  // Create new orders with smaller amounts
  const ethAmount = ethers.utils.parseEther("0.01");
  const tokenAmount = ethers.utils.parseEther("10"); // 10 TUSDC

  console.log("\nCreating new orders with smaller amounts...");
  
  // Create order with ETH for TUSDC
  const tx3 = await orderBook.createOrderWithETH(
    testToken.address,
    tokenAmount,
    { value: ethAmount }
  );
  const receipt3 = await tx3.wait();
  const orderId3 = receipt3.events?.find(e => e.event === "OrderCreated")?.args?.orderId;
  console.log("Created new order", orderId3.toString(), "- Offering", ethers.utils.formatEther(ethAmount), "ETH for", ethers.utils.formatEther(tokenAmount), "TUSDC");

  // Approve OrderBook to spend tokens (if needed)
  const allowance = await testToken.allowance(deployer.address, orderBook.address);
  if (allowance.lt(tokenAmount)) {
    const approveTx = await testToken.approve(orderBook.address, ethers.utils.parseEther("1000"));
    await approveTx.wait();
    console.log("Approved OrderBook to spend TUSDC");
  }

  // Create order with TUSDC for ETH
  const tx4 = await orderBook.createOrderForETH(
    testToken.address,
    tokenAmount,
    ethAmount
  );
  const receipt4 = await tx4.wait();
  const orderId4 = receipt4.events?.find(e => e.event === "OrderCreated")?.args?.orderId;
  console.log("Created new order", orderId4.toString(), "- Offering", ethers.utils.formatEther(tokenAmount), "TUSDC for", ethers.utils.formatEther(ethAmount), "ETH");

  // Print final balances
  const ethBalance = await deployer.getBalance();
  const tusdcBalance = await testToken.balanceOf(deployer.address);
  const contractEthBalance = await ethers.provider.getBalance(orderBookAddress);
  const contractTusdcBalance = await testToken.balanceOf(orderBookAddress);

  console.log("\nFinal Balances:");
  console.log("Your Account:");
  console.log("ETH balance:", ethers.utils.formatEther(ethBalance), "ETH");
  console.log("TUSDC balance:", ethers.utils.formatEther(tusdcBalance), "TUSDC");
  console.log("\nOrderBook Contract:");
  console.log("ETH balance:", ethers.utils.formatEther(contractEthBalance), "ETH");
  console.log("TUSDC balance:", ethers.utils.formatEther(contractTusdcBalance), "TUSDC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
