require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "obscuro",
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
    local: {
      url: 'http://localhost:8025/',
      gasPrice: 225,
      chainId: 1337,
      accounts: [
        "0xf52e5418e349dccdda29b6ac8b0abe6576bb7713886aa85abea6181ba731f9bb",
        "0x8ead642ca80dadb0f346a66cd6aa13e08a8ac7b5c6f7578d4bac96f5db01ac99"
      ]
    },
    obscuro: {
      url: 'http://127.0.0.1:3001/',
      gasPrice: 2,
      chainId: 777,
      accounts: [
        "0x8dfb8083da6275ae3e4f41e3e8a8c19d028d32c9247e24530933782f2a05035b"
      ]
    },
  }
};
