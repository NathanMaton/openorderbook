import { ethers } from "hardhat";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ORDERBOOK_ADDRESS = "0xC60232938000fDA18590C3578a92f0a56c039647";
const USDC_DECIMALS = 6;

async function main() {
    const provider = new ethers.providers.JsonRpcProvider("https://mainnet.base.org");
    
    // Get OrderBook contract
    const orderBook = new ethers.Contract(
        ORDERBOOK_ADDRESS,
        [
            "function getActiveOrders() view returns (uint256[])",
            "function getOrder(uint256 orderId) view returns (tuple(uint256 id, address maker, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, bool active, uint256 timestamp))"
        ],
        provider
    );

    // Get all active orders
    const activeOrders = await orderBook.getActiveOrders();
    console.log(`Total active orders: ${activeOrders.length}\n`);

    if (activeOrders.length === 0) {
        console.log("No active orders found.");
        return;
    }

    // Display each order's details
    for (const orderId of activeOrders) {
        const order = await orderBook.getOrder(orderId);
        console.log(`Order #${orderId}:`);
        console.log(`Type: ${order.tokenIn === ethers.constants.AddressZero ? 'ETH->USDC' : 'USDC->ETH'}`);
        console.log(`Maker: ${order.maker}`);
        console.log(`Amount In: ${
            order.tokenIn === ethers.constants.AddressZero ? 
            ethers.utils.formatEther(order.amountIn) + ' ETH' : 
            ethers.utils.formatUnits(order.amountIn, USDC_DECIMALS) + ' USDC'
        }`);
        console.log(`Amount Out: ${
            order.tokenOut === ethers.constants.AddressZero ? 
            ethers.utils.formatEther(order.amountOut) + ' ETH' : 
            ethers.utils.formatUnits(order.amountOut, USDC_DECIMALS) + ' USDC'
        }`);
        console.log(`Created: ${new Date(order.timestamp.toNumber() * 1000).toLocaleString()}`);
        console.log("-------------------");
    }

    // Count orders by type
    const ethToUsdc = activeOrders.filter(async (id) => {
        const order = await orderBook.getOrder(id);
        return order.tokenIn === ethers.constants.AddressZero;
    });

    console.log(`\nSummary:`);
    console.log(`ETH -> USDC orders: ${ethToUsdc.length}`);
    console.log(`USDC -> ETH orders: ${activeOrders.length - ethToUsdc.length}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
