require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle");

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
      url: 'http://127.0.0.1:4001/',
      gasPrice: 225,
      chainId: 777,
      accounts: [
        "0x8dfb8083da6275ae3e4f41e3e8a8c19d028d32c9247e24530933782f2a05035b"
      ]
    },
  }
};
