require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle");
require('dotenv').config({ path: '../.env' });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "localwallet",
  solidity: {
    compilers: [
      {
        version: "0.8.9",
      },
    ],
  },
  mocha: {
    timeout: 100000000
  },
  networks: {
    localwallet: {
      url: 'http://127.0.0.1:4001/v1/',
      gasPrice: 20000,
      chainId: 443,
      accounts: [
        `${process.env.pk_string}`
      ]
    },
  }
};
