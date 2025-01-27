import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;

// Account addresses
const ACCOUNT1 = "0xB202eBcc42131DCC09A23fcDd53178Ebe4A1698B";
const ACCOUNT2 = "0x16606CFc3761e70A9394D389EE04008Dd8c17bEd";

async function main() {
    if (!process.env.PRIVATE_KEY2) {
        throw new Error("PRIVATE_KEY2 not found in .env file");
    }

    // Create provider and wallet
    const provider = new ethers.providers.JsonRpcProvider("https://mainnet.base.org");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY2, provider);
    
    console.log("Connected with:", wallet.address);
    console.log("From account:", ACCOUNT2);
    console.log("To account:", ACCOUNT1);

    const usdc = new ethers.Contract(
        USDC_ADDRESS,
        ["function transfer(address to, uint256 amount) returns (bool)", "function balanceOf(address account) view returns (uint256)"],
        wallet
    );

    // Check initial balances
    const initialBalance1 = await usdc.balanceOf(ACCOUNT1);
    const initialBalance2 = await usdc.balanceOf(ACCOUNT2);
    
    console.log("\nInitial Balances:");
    console.log(`Account 1: ${ethers.utils.formatUnits(initialBalance1, USDC_DECIMALS)} USDC`);
    console.log(`Account 2: ${ethers.utils.formatUnits(initialBalance2, USDC_DECIMALS)} USDC`);

    if (wallet.address.toLowerCase() !== ACCOUNT2.toLowerCase()) {
        console.log("\nWrong account! The private key doesn't match Account 2's address");
        return;
    }

    // Transfer 10 USDC
    const amount = ethers.utils.parseUnits("10", USDC_DECIMALS);
    console.log("\nTransferring 10 USDC...");
    const tx = await usdc.transfer(ACCOUNT1, amount);
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");
    await tx.wait();
    console.log("Transfer complete!");

    // Check final balances
    const finalBalance1 = await usdc.balanceOf(ACCOUNT1);
    const finalBalance2 = await usdc.balanceOf(ACCOUNT2);
    
    console.log("\nFinal Balances:");
    console.log(`Account 1: ${ethers.utils.formatUnits(finalBalance1, USDC_DECIMALS)} USDC`);
    console.log(`Account 2: ${ethers.utils.formatUnits(finalBalance2, USDC_DECIMALS)} USDC`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
