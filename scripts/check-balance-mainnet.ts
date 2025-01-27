import { ethers } from "hardhat";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

async function main() {
    const [signer] = await ethers.getSigners();
    console.log("Checking balance for:", signer.address);

    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    const balance = await usdc.balanceOf(signer.address);
    
    console.log(`USDC Balance: ${ethers.utils.formatUnits(balance, 6)} USDC`);
    
    const ethBalance = await signer.getBalance();
    console.log(`ETH Balance: ${ethers.utils.formatEther(ethBalance)} ETH`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
