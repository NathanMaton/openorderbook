const { ethers } = require("ethers");

// Generate a new random wallet
const wallet = ethers.Wallet.createRandom();

console.log("🔑 New Wallet Generated for Order Filling!");
console.log("-".repeat(50));
console.log("📝 Address:", wallet.address);
console.log("🔐 Private Key:", wallet.privateKey);
console.log("🌱 Mnemonic:", wallet.mnemonic.phrase);
console.log("-".repeat(50));
console.log("⚠️  IMPORTANT: Save these details securely!");
console.log("💡 Next steps:");
console.log("1. Send some Base Sepolia ETH to this address");
console.log("2. Use the private key (without 0x prefix) in a new .env file");
