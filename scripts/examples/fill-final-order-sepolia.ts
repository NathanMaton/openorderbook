import { ethers } from "hardhat";

async function displayBalances(account: any, testToken: any, label: string) {
    const ethBalance = await account.getBalance();
    const tusdcBalance = await testToken.balanceOf(account.address);
    
    console.log(`\n${label} (${account.address}):`);
    console.log(`ETH: ${ethers.utils.formatEther(ethBalance)} ETH`);
    console.log(`TUSDC: ${ethers.utils.formatEther(tusdcBalance)} TUSDC`);
}

async function main() {
    const [deployer, account2] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Second account:", account2.address);

    // Connect to existing contracts
    const orderBookAddress = "0x99FBFa4A56BC17DA8581669f7b86aB9F6FB7b944";
    const testTokenAddress = "0x4b86D9bf6eAd5af00Ff21209C19158f2BDf6C938";

    const OrderBookWithETH = await ethers.getContractFactory("OrderBookWithETH");
    const orderBook = OrderBookWithETH.attach(orderBookAddress);

    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = TestToken.attach(testTokenAddress);

    // Show initial balances
    console.log("\nInitial Balances:");
    await displayBalances(deployer, testToken, "Deployer Account");
    await displayBalances(account2, testToken, "Second Account");

    // Get the remaining order
    const activeOrders = await orderBook.getActiveOrders();
    console.log("\nActive orders:", activeOrders.length);
    
    if (activeOrders.length > 0) {
        const orderId = activeOrders[0];
        const order = await orderBook.getOrder(orderId);
        console.log(`\nFilling remaining order #${orderId}:`);
        console.log(`Type: ${order.tokenIn === await orderBook.ETH_ADDRESS() ? 'ETH->TUSDC' : 'TUSDC->ETH'}`);
        console.log(`Amount In: ${ethers.utils.formatEther(order.amountIn)} ${order.tokenIn === await orderBook.ETH_ADDRESS() ? 'ETH' : 'TUSDC'}`);
        console.log(`Amount Out: ${ethers.utils.formatEther(order.amountOut)} ${order.tokenOut === await orderBook.ETH_ADDRESS() ? 'ETH' : 'TUSDC'}`);

        // Fill the order
        try {
            await testToken.connect(account2).approve(orderBookAddress, order.amountOut);
            await orderBook.connect(account2).fillOrder(orderId);
            console.log("Successfully filled the order");
        } catch (e) {
            console.log("Error filling order:", e.message);
        }
    }

    // Show final balances
    console.log("\nFinal Balances:");
    await displayBalances(deployer, testToken, "Deployer Account");
    await displayBalances(account2, testToken, "Second Account");

    // Show contract balances
    const contractEthBalance = await ethers.provider.getBalance(orderBookAddress);
    const contractTusdcBalance = await testToken.balanceOf(orderBookAddress);
    console.log("\nOrderBook Contract Balances:");
    console.log(`ETH: ${ethers.utils.formatEther(contractEthBalance)} ETH`);
    console.log(`TUSDC: ${ethers.utils.formatEther(contractTusdcBalance)} TUSDC`);

    // Verify no active orders remain
    const finalActiveOrders = await orderBook.getActiveOrders();
    console.log(`\nRemaining active orders: ${finalActiveOrders.length}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
