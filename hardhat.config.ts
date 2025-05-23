import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    "base-sepolia": {
      url: "https://sepolia.base.org",
      accounts: [
        ...(process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []),
        ...(process.env.PRIVATE_KEY2 ? [process.env.PRIVATE_KEY2] : [])
      ],
      chainId: 84532
    },
    "base": {
      url: process.env.BASE_URL || "https://mainnet.base.org",
      accounts: [
        process.env.PRIVATE_KEY || "",
        process.env.PRIVATE_KEY2 || ""
      ],
      chainId: 8453,
      gasPrice: 1000000000  // 1 gwei
    }
  },
  etherscan: {
    apiKey: {
      "base-sepolia": process.env.BASESCAN_API_KEY || "",
      "base": process.env.BASESCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      }
    ]
  }
};

export default config;
