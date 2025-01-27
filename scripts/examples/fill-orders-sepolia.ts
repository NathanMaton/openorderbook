import { ethers } from "hardhat";

async function main() {
  // Get both accounts
  const [deployer, account2] = await ethers.getSigners();
  const account = account2 || deployer; // Use account2 if available, otherwise use deployer
  console.log("Using account for fills:", account.address);
  console.log("Deployer account:", deployer.address);

  // Connect to existing contracts
  const orderBookAddress = "0x68C48cd6F32907e93F2c9652c10DF68242600459";
  const testTokenAddress = "0x1Fec12865acA0c259FD79ac6CA1B31c2018970C4";

  const OrderBookWithETH = await ethers.getContractFactory("OrderBookWithETH");
  const orderBook = OrderBookWithETH.attach(orderBookAddress);

  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = TestToken.attach(testTokenAddress);

  // Print initial balances
  const initialEthBalance = await account.getBalance();
  const initialTusdcBalance = await testToken.balanceOf(account.address);
  
  console.log("\nInitial Balances for fill account:");
  console.log("ETH:", ethers.utils.formatEther(initialEthBalance), "ETH");
  console.log("TUSDC:", ethers.utils.formatEther(initialTusdcBalance), "TUSDC");

  // Transfer TUSDC from deployer to second account if needed
  const minRequired = ethers.utils.parseEther("20"); // We need at least 10 TUSDC for filling orders
  if ((await testToken.balanceOf(account.address)).lt(minRequired)) {
    console.log("\nTransferring 20 TUSDC from deployer to fill account...");
    const transferTx = await testToken.connect(deployer).transfer(account.address, ethers.utils.parseEther("20"));
    await transferTx.wait();
    console.log("Transferred 20 TUSDC to fill account");
  }

  // Approve OrderBook to spend TUSDC
  const approveTx = await testToken.connect(account).approve(orderBookAddress, ethers.utils.parseEther("1000"));
  await approveTx.wait();
  console.log("Approved OrderBook to spend TUSDC");

  // Fill Order #3 (ETH->TUSDC) by sending TUSDC
  console.log("\nFilling Order #3 (receiving 0.01 ETH for 10 TUSDC)...");
  try {
    const tx1 = await orderBook.connect(account).fillOrder(3);
    await tx1.wait();
    console.log("Successfully filled Order #3");
  } catch (e) {
    console.log("Error filling Order #3:", e.message);
  }

  // Fill Order #4 (TUSDC->ETH) by sending ETH
  console.log("\nFilling Order #4 (receiving 10 TUSDC for 0.01 ETH)...");
  try {
    const tx2 = await orderBook.connect(account).fillOrder(4, {
      value: ethers.utils.parseEther("0.01")
    });
    await tx2.wait();
    console.log("Successfully filled Order #4");
  } catch (e) {
    console.log("Error filling Order #4:", e.message);
  }

  // Print final balances
  const finalEthBalance = await account.getBalance();
  const finalTusdcBalance = await testToken.balanceOf(account.address);
  
  console.log("\nFinal Balances for fill account:");
  console.log("ETH:", ethers.utils.formatEther(finalEthBalance), "ETH");
  console.log("TUSDC:", ethers.utils.formatEther(finalTusdcBalance), "TUSDC");

  // Print contract balances
  const contractEthBalance = await ethers.provider.getBalance(orderBookAddress);
  const contractTusdcBalance = await testToken.balanceOf(orderBookAddress);
  
  console.log("\nOrderBook Contract Balances:");
  console.log("ETH:", ethers.utils.formatEther(contractEthBalance), "ETH");
  console.log("TUSDC:", ethers.utils.formatEther(contractTusdcBalance), "TUSDC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
