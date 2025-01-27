import { ethers } from "hardhat";

async function main() {
    // Get the second wallet
    const privateKey2 = process.env.PRIVATE_KEY2;
    if (!privateKey2) {
        throw new Error("PRIVATE_KEY2 not found in .env");
    }

    // Create a wallet instance
    const provider = ethers.provider;
    const wallet2 = new ethers.Wallet(privateKey2, provider);

    // Contract addresses
    const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";
    const ORDERBOOK_ADDRESS = "0x81F9C31C5E6B130B2EE94143ba7C4898B4c686Db";

    // Get contract instances with wallet2 as signer
    const weth = await ethers.getContractAt("IWETH", WETH_ADDRESS, wallet2);
    const orderBook = await ethers.getContractAt("OrderBook", ORDERBOOK_ADDRESS, wallet2);

    // Wrap 0.01 ETH to WETH
    console.log("Wrapping ETH to WETH...");
    const wrapAmount = ethers.utils.parseEther("0.01");
    const wrapTx = await weth.deposit({ value: wrapAmount });
    await wrapTx.wait();
    console.log("Wrapped", ethers.utils.formatEther(wrapAmount), "ETH to WETH");

    // Approve OrderBook to spend WETH
    console.log("Approving OrderBook to spend WETH...");
    const approveTx = await weth.approve(ORDERBOOK_ADDRESS, wrapAmount);
    await approveTx.wait();
    console.log("Approved OrderBook to spend WETH");

    // Fill the order
    console.log("Filling order...");
    const fillTx = await orderBook.fillOrder(1); // Order ID 1
    const receipt = await fillTx.wait();
    console.log("Order filled! Transaction hash:", receipt.transactionHash);

    // Check balances
    const wethBalance = await weth.balanceOf(wallet2.address);
    console.log("Remaining WETH balance:", ethers.utils.formatEther(wethBalance));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
