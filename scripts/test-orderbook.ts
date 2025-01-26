import { ethers } from "hardhat";

async function main() {
    // Contract addresses
    const ORDERBOOK_ADDRESS = "0x81F9C31C5E6B130B2EE94143ba7C4898B4c686Db";
    
    // Get the OrderBook contract
    const OrderBook = await ethers.getContractFactory("OrderBook");
    const orderBook = OrderBook.attach(ORDERBOOK_ADDRESS);

    // Deploy two test tokens
    const TestToken = await ethers.getContractFactory("TestToken");
    console.log("Deploying test tokens...");
    
    const tokenA = await TestToken.deploy("Test Token A", "TTA");
    await tokenA.deployed();
    console.log("Token A deployed to:", tokenA.address);

    const tokenB = await TestToken.deploy("Test Token B", "TTB");
    await tokenB.deployed();
    console.log("Token B deployed to:", tokenB.address);

    // Mint some tokens to our account
    const [signer] = await ethers.getSigners();
    const amount = ethers.utils.parseEther("1000");
    
    console.log("Minting tokens...");
    await tokenA.mint(signer.address, amount);
    await tokenB.mint(signer.address, amount);

    // Approve the OrderBook contract to spend our tokens
    console.log("Approving OrderBook to spend tokens...");
    await tokenA.approve(ORDERBOOK_ADDRESS, amount);
    await tokenB.approve(ORDERBOOK_ADDRESS, amount);

    // Create an order
    console.log("Creating order...");
    const amountIn = ethers.utils.parseEther("10");
    const amountOut = ethers.utils.parseEther("5");
    
    const tx = await orderBook.createOrder(
        tokenA.address,
        tokenB.address,
        amountIn,
        amountOut
    );
    const receipt = await tx.wait();
    
    // Get the OrderCreated event
    const event = receipt.events?.find(e => e.event === 'OrderCreated');
    const orderId = event?.args?.orderId;
    
    console.log(`Order created with ID: ${orderId}`);
    console.log(`Selling ${ethers.utils.formatEther(amountIn)} Token A for ${ethers.utils.formatEther(amountOut)} Token B`);

    // Get the order details
    const order = await orderBook.getOrder(orderId);
    console.log("\nOrder details:");
    console.log("Maker:", order.maker);
    console.log("Token In:", order.tokenIn);
    console.log("Token Out:", order.tokenOut);
    console.log("Amount In:", ethers.utils.formatEther(order.amountIn));
    console.log("Amount Out:", ethers.utils.formatEther(order.amountOut));
    console.log("Active:", order.active);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
