import { ethers } from "hardhat";

async function displayOrders(contract: any, testToken: any) {
    console.log("\nQuerying orders...");
    
    const activeOrders = await contract.getActiveOrders();
    console.log(`Total active orders: ${activeOrders.length}`);
    
    if (activeOrders.length > 0) {
        console.log("\nActive Order Details:");
        for (const orderId of activeOrders) {
            const order = await contract.getOrder(orderId);
            const ethAddress = await contract.ETH_ADDRESS();
            console.log(`Order #${orderId}:`);
            console.log(`  Type: ${order.tokenIn === ethAddress ? 'ETH->TUSDC' : 'TUSDC->ETH'}`);
            console.log(`  Amount In: ${ethers.utils.formatEther(order.amountIn)} ${order.tokenIn === ethAddress ? 'ETH' : 'TUSDC'}`);
            console.log(`  Amount Out: ${ethers.utils.formatEther(order.amountOut)} ${order.tokenOut === ethAddress ? 'ETH' : 'TUSDC'}`);
            console.log(`  Maker: ${order.maker}`);
        }
    }
}

async function main() {
    const [deployer, account2] = await ethers.getSigners();
    console.log("Using account for fills:", account2 ? account2.address : "Not available");

    // Connect to existing contracts
    const orderBookAddress = "0x99FBFa4A56BC17DA8581669f7b86aB9F6FB7b944";
    const testTokenAddress = "0x4b86D9bf6eAd5af00Ff21209C19158f2BDf6C938";

    const OrderBookWithETH = await ethers.getContractFactory("OrderBookWithETH");
    const orderBook = OrderBookWithETH.attach(orderBookAddress);

    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = TestToken.attach(testTokenAddress);

    // Get current active orders
    const activeOrders = await orderBook.getActiveOrders();
    console.log(`\nInitial active orders: ${activeOrders.length}`);
    await displayOrders(orderBook, testToken);

    // Choose a random order to keep unfilled
    const orderToKeep = activeOrders[Math.floor(Math.random() * activeOrders.length)];
    console.log(`\nRandomly chosen order #${orderToKeep} will be kept unfilled`);

    // Approve token spending if needed
    const maxApproval = ethers.utils.parseEther("1000");
    await testToken.connect(account2).approve(orderBookAddress, maxApproval);
    console.log("Approved TUSDC spending");

    // Fill all orders except the chosen one
    console.log("\nFilling orders...");
    for (const orderId of activeOrders) {
        if (orderId.toString() === orderToKeep.toString()) {
            console.log(`Skipping order #${orderId} (chosen to keep)`);
            continue;
        }

        const order = await orderBook.getOrder(orderId);
        const ethAddress = await orderBook.ETH_ADDRESS();
        
        try {
            if (order.tokenOut === ethAddress) {
                // Need to send ETH
                await orderBook.connect(account2).fillOrder(orderId, {
                    value: order.amountOut
                });
            } else {
                // Need to send TUSDC
                await orderBook.connect(account2).fillOrder(orderId);
            }
            console.log(`Filled order #${orderId}`);
        } catch (e) {
            console.log(`Error filling order #${orderId}:`, e.message);
        }
    }

    // Show final state
    console.log("\nFinal state:");
    await displayOrders(orderBook, testToken);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
