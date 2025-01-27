import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ORDERBOOK_ADDRESS = "0xC60232938000fDA18590C3578a92f0a56c039647";
const USDC_DECIMALS = 6;

async function main() {
    if (!process.env.PRIVATE_KEY2) {
        throw new Error("PRIVATE_KEY2 not found in .env file");
    }

    // Create provider and wallet for Account 2
    const provider = new ethers.providers.JsonRpcProvider("https://mainnet.base.org");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY2, provider);
    
    console.log("Connected with:", wallet.address);

    // Get contracts
    const orderBook = new ethers.Contract(
        ORDERBOOK_ADDRESS,
        [
            "function getOrder(uint256 orderId) view returns (tuple(uint256 id, address maker, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, bool active, uint256 timestamp))",
            "function fillOrder(uint256 orderId) payable"
        ],
        wallet
    );

    const usdc = new ethers.Contract(
        USDC_ADDRESS,
        [
            "function approve(address spender, uint256 amount) returns (bool)",
            "function balanceOf(address account) view returns (uint256)"
        ],
        wallet
    );

    // Get order details
    const orderId = 1;
    const order = await orderBook.getOrder(orderId);
    console.log("\nOrder details:");
    console.log(`Maker: ${order.maker}`);
    console.log(`Token In: ${order.tokenIn === ethers.constants.AddressZero ? 'ETH' : 'USDC'}`);
    console.log(`Amount In: ${order.tokenIn === ethers.constants.AddressZero ? 
        ethers.utils.formatEther(order.amountIn) + ' ETH' : 
        ethers.utils.formatUnits(order.amountIn, USDC_DECIMALS) + ' USDC'}`);
    console.log(`Token Out: ${order.tokenOut === ethers.constants.AddressZero ? 'ETH' : 'USDC'}`);
    console.log(`Amount Out: ${order.tokenOut === ethers.constants.AddressZero ? 
        ethers.utils.formatEther(order.amountOut) + ' ETH' : 
        ethers.utils.formatUnits(order.amountOut, USDC_DECIMALS) + ' USDC'}`);
    console.log(`Active: ${order.active}`);

    if (!order.active) {
        console.log("Order is not active!");
        return;
    }

    // Check USDC balance and approve if needed
    if (order.tokenOut === USDC_ADDRESS) {
        const balance = await usdc.balanceOf(wallet.address);
        console.log(`\nUSDC Balance: ${ethers.utils.formatUnits(balance, USDC_DECIMALS)} USDC`);
        
        if (balance.lt(order.amountOut)) {
            console.log("Insufficient USDC balance!");
            return;
        }

        console.log("\nApproving USDC...");
        const approveTx = await usdc.approve(ORDERBOOK_ADDRESS, order.amountOut);
        await approveTx.wait();
        console.log("USDC approved");
    }

    // Fill the order
    console.log("\nFilling order...");
    const tx = await orderBook.fillOrder(orderId, {
        value: order.tokenOut === ethers.constants.AddressZero ? order.amountOut : 0
    });
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");
    await tx.wait();
    console.log("Order filled successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
