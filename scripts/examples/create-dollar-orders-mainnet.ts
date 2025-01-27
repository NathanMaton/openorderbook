import { ethers } from "hardhat";

// USDC has 6 decimals
const USDC_DECIMALS = 6;
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ORDERBOOK_ADDRESS = "0xC60232938000fDA18590C3578a92f0a56c039647";

// $1 worth of USDC (1 * 10^6)
const ONE_DOLLAR_USDC = ethers.utils.parseUnits("1", USDC_DECIMALS);

async function getEthPrice() {
    // Using Base's ETH/USD price feed
    const aggregatorAddress = "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70";
    const aggregatorABI = [
        "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"
    ];
    const aggregator = await ethers.getContractAt(aggregatorABI, aggregatorAddress);
    const { answer } = await aggregator.latestRoundData();
    return answer;
}

async function main() {
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);

    // Get contracts
    const orderBook = await ethers.getContractAt("OrderBookV2", ORDERBOOK_ADDRESS);
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);

    // Get current ETH price
    const ethPrice = await getEthPrice();
    console.log(`Current ETH price: $${ethPrice.toString() / 1e8}`);

    // Calculate ETH amount for $1
    const ethFor1Dollar = ethers.utils.parseEther("1").mul(ethers.BigNumber.from(10).pow(8)).div(ethPrice);
    console.log(`ETH amount for $1: ${ethers.utils.formatEther(ethFor1Dollar)} ETH`);

    // First approve USDC spending
    console.log("\nApproving USDC spending...");
    const approveTx = await usdc.approve(ORDERBOOK_ADDRESS, ONE_DOLLAR_USDC);
    await approveTx.wait();
    console.log("USDC approved");

    // Create first order: ETH -> USDC
    console.log("\nCreating ETH -> USDC order...");
    const order1Tx = await orderBook.createOrderWithETH(
        USDC_ADDRESS,
        ONE_DOLLAR_USDC,
        { value: ethFor1Dollar }
    );
    const order1Receipt = await order1Tx.wait();
    const order1Event = order1Receipt.events?.find(e => e.event === "OrderCreated");
    console.log(`Order 1 created with ID: ${order1Event?.args?.orderId}`);

    // Create second order: USDC -> ETH
    console.log("\nCreating USDC -> ETH order...");
    const order2Tx = await orderBook.createOrderForETH(
        USDC_ADDRESS,
        ONE_DOLLAR_USDC,
        ethFor1Dollar
    );
    const order2Receipt = await order2Tx.wait();
    const order2Event = order2Receipt.events?.find(e => e.event === "OrderCreated");
    console.log(`Order 2 created with ID: ${order2Event?.args?.orderId}`);

    // Query and display all active orders
    console.log("\nActive Orders:");
    const activeOrders = await orderBook.getActiveOrders();
    for (const orderId of activeOrders) {
        const order = await orderBook.getOrder(orderId);
        console.log(`\nOrder #${orderId}:`);
        console.log(`Type: ${order.tokenIn === ethers.constants.AddressZero ? 'ETH->USDC' : 'USDC->ETH'}`);
        console.log(`Amount In: ${
            order.tokenIn === ethers.constants.AddressZero 
                ? ethers.utils.formatEther(order.amountIn) + ' ETH'
                : ethers.utils.formatUnits(order.amountIn, USDC_DECIMALS) + ' USDC'
        }`);
        console.log(`Amount Out: ${
            order.tokenOut === ethers.constants.AddressZero
                ? ethers.utils.formatEther(order.amountOut) + ' ETH'
                : ethers.utils.formatUnits(order.amountOut, USDC_DECIMALS) + ' USDC'
        }`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
