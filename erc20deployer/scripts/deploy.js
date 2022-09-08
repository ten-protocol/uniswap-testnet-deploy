const hre = require("hardhat");
const {ethers} = require("hardhat");
const axios = require("axios");
const {expect} = require("chai");
const fs = require("fs");

async function main() {
  console.log(process.argv);
  let owner = {}
  if (process.argv.length == 2) {
    owner = await ethers.getSigners();
  } else {
    owner = new ethers.Wallet( process.argv[2], ethers.provider);
  }

  const walletSetup = await setupWalletExtention(owner)

  if (!walletSetup) {
    return
  }

  const mintedAmount = ethers.utils.parseEther("1234567891");
  let state = {}
  for (const contract of [
    { name: "Wrapped Ether", token: "WETH"},
    { name: "Pedro Token", token: "PTK"},
    { name: "USDC", token: "USDC"},
  ]) {
    let address = await deployContract(owner, contract, mintedAmount);
    state[contract.token+"Address"] = address.toString()
  }
  console.log(JSON.stringify(state,null,''));

  try {
    fs.writeFileSync('./state.json', JSON.stringify(state,null,''));
    // file written successfully
  } catch (err) {
    console.error(err);
  }

  // handle the token list
  writeTokenList(state);

}

function writeTokenList(addresses) {
  tokenList = {
    "name": "Obscuro Token List",
    "logoURI": "https://pbs.twimg.com/profile_images/1460984508090658824/wGnI8m6s_400x400.jpg",
    "keywords": [
      "audited",
      "verified",
      "special tokens",
      "super nice"
    ],
    "tags": {
      "stablecoin": {
        "name": "Stablecoin",
        "description": "Tokens that are fixed to an external asset, e.g. the US dollar"
      },
      "meme": {
        "name": "Meme coin",
        "description": "Tokens that earn interest meme history"
      },
      "native": {
        "name": "Natively Wrapped",
        "description": "Native representation token"
      }
    },
    "timestamp": "2020-06-12T00:00:00+00:00",
    "tokens": [
      {
        "chainId": 777,
        "address": addresses["USDCAddress"],
        "symbol": "USDC",
        "name": "USD Coin",
        "decimals": 18,
        "logoURI": "ipfs://QmXfzKRvjZz3u5JRgC4v5mGVbm9ahrUiB4DgzHBsnWbTMM",
        "tags": [
          "stablecoin"
        ]
      },
      {
        "chainId": 777,
        "address": addresses["WETHAddress"],
        "symbol": "WOBX",
        "name": "Wrapped Obx",
        "decimals": 18,
        "logoURI": "ipfs://QmXfzKRvjZz3u5JRgC4v5mGVbm9ahrUiB4DgzHBsnWbTMM",
        "tags": [
          "native"
        ]
      },
      {
        "chainId": 777,
        "address": addresses["PTKAddress"],
        "symbol": "PTK",
        "name": "Pedro Token",
        "decimals": 18,
        "logoURI": "https://i.ytimg.com/vi/SB_oU68Q9zA/mqdefault.jpg",
        "tags": [
          "meme"
        ]
      }
    ],
    "version": {
      "major": 1,
      "minor": 0,
      "patch": 0
    }
  }

  try {
    fs.writeFileSync('./tokenlist.json', JSON.stringify(tokenList,null,''));
    // file written successfully
  } catch (err) {
    console.error(err);
  }
}

async function deployContract(addr, contractDetails, mintAmount) {
  let contractDeployed = {}
  if (contractDetails.token == "WETH") {
    const contract = await ethers.getContractFactory("WETH9");
    contractDeployed = await contract.connect(addr).deploy();
    // test the contract is responding correctly
    expect(await contractDeployed.totalSupply()).to.equal(0);
  } else  {
    const contract = await ethers.getContractFactory("ERC20Default");
    contractDeployed = await contract.connect(addr).deploy(contractDetails.name, contractDetails.token, mintAmount);
    // test the contract is responding correctly
    expect(await contractDeployed.totalSupply()).to.equal(mintAmount);
  }
  console.log("Address: " + addr.address.toString() +" Deployed Contract: " + contractDetails.name + " to: " + contractDeployed.address.toString());

  return contractDeployed.address
}

async function setupWalletExtention(addr) {
  let signValue = "";
  await axios
      .post('http://127.0.0.1:3001/generateviewingkey/',
          JSON.stringify({"address": addr.address.toString()}),
          { headers: { 'Content-Type': 'application/json' } },
      )
      .then(res => {
        signValue = res.data;
      })
      .catch(error => {
        console.error(error);
      });

  let signed_msg = await addr.signMessage("vk" + signValue);
  await axios
      .post('http://127.0.0.1:3001/submitviewingkey/',
          JSON.stringify({"address": addr.address.toString(), "signature": signed_msg}),
          { headers: { 'Content-Type': 'application/json' } },
      )
      .catch(error => {
        console.error(error);
      });
  console.log("Successfully setup Wallet Extension for " + addr.address.toString())
  return true
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
