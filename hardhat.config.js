require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-etherscan');
require('solidity-coverage');
require('@typechain/hardhat');
require('dotenv').config({ path: './.env.local' });
const fs = require('fs');
const mnemonic = fs.readFileSync('.secret').toString();

module.exports = {
  solidity: '0.8.4',
  settings: {
    optimizer: {
      enabled: true,
      runs: 1000,
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`,
      chainId: 80001,
      accounts: { mnemonic, count: 1 },
    },
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`,
      chainId: 137,
      accounts: { mnemonic, count: 1 },
    },
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_KEY,
      polygonMumbai: process.env.POLYGONSCAN_KEY,
    },
  },
  typechain: {
    outDir: 'types'
  }
};
