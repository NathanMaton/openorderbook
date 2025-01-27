import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ORDERBOOK_ADDRESS = "0xC60232938000fDA18590C3578a92f0a56c039647";
const USDC_DECIMALS = 6;

async function getEthPrice() {
    const aggregatorAddress = "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70";
    const aggregatorABI = [
        "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"
    ];
    const aggregator = await ethers.getContractAt(aggregatorABI, aggregatorAddress);
    const { answer } = await aggregator.latestRoundData();
    return answer;
}

async function createOrder(
    orderBook: ethers.Contract,
    usdc: ethers.Contract,
    ethAmount: string | null,
    usdcAmount: string,
    signer: ethers.Signer
) {
    const ethValue = ethAmount ? ethers.utils.parseEther(ethAmount) : "0";
    const usdcValue = ethers.utils.parseUnits(usdcAmount, USDC_DECIMALS);

    if (!ethAmount) {
        // USDC -> ETH order
        await usdc.approve(orderBook.address, usdcValue);
        const tx = await orderBook.createOrderForETH(USDC_ADDRESS, usdcValue, ethValue);
        const receipt = await tx.wait();
        const event = receipt.events?.find(e => e.event === "OrderCreated");
        return event?.args?.orderId;
    } else {
        // ETH -> USDC order
        const tx = await orderBook.createOrderWithETH(USDC_ADDRESS, usdcValue, { value: ethValue });
        const receipt = await tx.wait();
        const event = receipt.events?.find(e => e.event === "OrderCreated");
        return event?.args?.orderId;
    }
}

async function displayOrders(orderBook: ethers.Contract) {
    const activeOrders = await orderBook.getActiveOrders();
    console.log(`\nActive Orders (${activeOrders.length} total):`);
    
    for (const orderId of activeOrders) {
        const order = await orderBook.getOrder(orderId);
        console.log(`\nOrder #${orderId}:`);
        console.log(`Type: ${order.tokenIn === ethers.constants.AddressZero ? 'ETH->USDC' : 'USDC->ETH'}`);
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
    }
}

async function main() {
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);

    const orderBook = await ethers.getContractAt("OrderBookV2", ORDERBOOK_ADDRESS);
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);

    // Get ETH price
    const ethPrice = await getEthPrice();
    console.log(`Current ETH price: $${ethPrice.toString() / 1e8}`);

    // Display current orders
    await displayOrders(orderBook);

    // Example: Create a $10 ETH->USDC order
    const ethFor10Dollars = ethers.utils.parseEther("1")
        .mul(ethers.BigNumber.from(10).mul(ethers.BigNumber.from(10).pow(8)))
        .div(ethPrice);
    
    console.log("\nCreating a $10 ETH->USDC order...");
    const orderId = await createOrder(
        orderBook,
        usdc,
        ethers.utils.formatEther(ethFor10Dollars),
        "10",
        signer
    );
    console.log(`Order created with ID: ${orderId}`);

    // Display updated orders
    await displayOrders(orderBook);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
