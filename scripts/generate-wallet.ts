import { ethers } from "ethers";

// Generate a new random wallet
const wallet = ethers.Wallet.createRandom();

console.log("🔑 New Wallet Generated!");
console.log("-".repeat(50));
console.log("📝 Address:", wallet.address);
console.log("🔐 Private Key:", wallet.privateKey);
console.log("🌱 Mnemonic:", wallet.mnemonic.phrase);
console.log("-".repeat(50));
console.log("⚠️  IMPORTANT: Save these details securely!");
console.log("💡 Next steps:");
console.log("1. Copy the private key (without 0x prefix) to your .env file");
console.log("2. Get Base Goerli ETH from the faucet: https://bridge.base.org/");
console.log("3. Get test tokens from: https://bridge.base.org/");
