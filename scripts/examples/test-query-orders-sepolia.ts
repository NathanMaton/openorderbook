import { ethers } from "hardhat";

async function displayOrders(contract: any, testToken: any) {
    console.log("\nQuerying orders...");
    
    const activeOrders = await contract.getActiveOrders();
    console.log(`Total active orders: ${activeOrders.length}`);
    
    const ethAddress = await contract.ETH_ADDRESS();
    const ethToToken = await contract.getOrdersByPair(ethAddress, testToken.address);
    const tokenToEth = await contract.getOrdersByPair(testToken.address, ethAddress);
    
    console.log(`ETH -> TUSDC orders: ${ethToToken.length}`);
    console.log(`TUSDC -> ETH orders: ${tokenToEth.length}`);
    
    console.log("\nActive Order Details:");
    for (const orderId of activeOrders) {
        const order = await contract.getOrder(orderId);
        console.log(`Order #${orderId}:`);
        console.log(`  Type: ${order.tokenIn === ethAddress ? 'ETH->TUSDC' : 'TUSDC->ETH'}`);
        console.log(`  Amount In: ${ethers.utils.formatEther(order.amountIn)} ${order.tokenIn === ethAddress ? 'ETH' : 'TUSDC'}`);
        console.log(`  Amount Out: ${ethers.utils.formatEther(order.amountOut)} ${order.tokenOut === ethAddress ? 'ETH' : 'TUSDC'}`);
        console.log(`  Maker: ${order.maker}`);
    }
}

async function main() {
    const [deployer, account2] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Second account:", account2 ? account2.address : "Not available");

    // Deploy new contracts for testing
    console.log("\nDeploying contracts...");
    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = await TestToken.deploy("Test USDC", "TUSDC");
    await testToken.deployed();
    console.log("TestToken deployed to:", testToken.address);

    const OrderBookWithETH = await ethers.getContractFactory("OrderBookWithETH");
    const orderBook = await OrderBookWithETH.deploy();
    await orderBook.deployed();
    console.log("OrderBook deployed to:", orderBook.address);

    // Mint tokens to both accounts
    const mintAmount = ethers.utils.parseEther("1000");
    await testToken.mint(deployer.address, mintAmount);
    if (account2) {
        await testToken.mint(account2.address, mintAmount);
    }
    console.log("\nMinted 1000 TUSDC to each account");

    // Approve OrderBook to spend tokens
    await testToken.approve(orderBook.address, mintAmount);
    if (account2) {
        await testToken.connect(account2).approve(orderBook.address, mintAmount);
    }
    console.log("Approved OrderBook to spend TUSDC");

    // Create 5 orders with varying sizes
    console.log("\nCreating orders...");
    const orders = [
        { ethAmount: "0.001", tokenAmount: "1" },
        { ethAmount: "0.003", tokenAmount: "3" },
        { ethAmount: "0.005", tokenAmount: "5" },
        { ethAmount: "0.007", tokenAmount: "7" },
        { ethAmount: "0.01", tokenAmount: "10" }
    ];

    for (const order of orders) {
        // Create ETH->TUSDC order
        await orderBook.createOrderWithETH(
            testToken.address,
            ethers.utils.parseEther(order.tokenAmount),
            { value: ethers.utils.parseEther(order.ethAmount) }
        );
        console.log(`Created ETH->TUSDC order: ${order.ethAmount} ETH for ${order.tokenAmount} TUSDC`);

        // Create TUSDC->ETH order
        await orderBook.createOrderForETH(
            testToken.address,
            ethers.utils.parseEther(order.tokenAmount),
            ethers.utils.parseEther(order.ethAmount)
        );
        console.log(`Created TUSDC->ETH order: ${order.tokenAmount} TUSDC for ${order.ethAmount} ETH`);
    }

    // Display all orders
    await displayOrders(orderBook, testToken);

    // Fill one order with second account
    if (account2) {
        console.log("\nFilling first ETH->TUSDC order with second account...");
        await orderBook.connect(account2).fillOrder(1);
        console.log("Filled order #1");

        // Display updated orders
        console.log("\nAfter filling order #1:");
        await displayOrders(orderBook, testToken);
    }

    console.log("\nTest completed!");
    console.log("OrderBook:", orderBook.address);
    console.log("TestToken:", testToken.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
