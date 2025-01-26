import { ethers } from "hardhat";

async function main() {
    const TestToken = await ethers.getContractFactory("TestToken");
    const token = await TestToken.deploy("Test USD", "tUSD");

    await token.deployed();

    console.log(`TestToken deployed to ${token.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
