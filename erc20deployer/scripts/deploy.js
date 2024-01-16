const hre = require("hardhat");
const {ethers} = require("hardhat");
const axios = require("axios");
const {expect} = require("chai");
const fs = require("fs");

let authedURL = ""
let authedToken = ""

async function main() {
  console.log(process.argv);
  let owner = {}
  if (process.argv.length == 2) {
    owner = await ethers.getSigners();
  } else {
    // const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:13010');
    owner = new ethers.Wallet( process.argv[2], ethers.provider);
  }

  const walletSetup = await join_and_register("http://127.0.0.1:4001", owner)

  if (!walletSetup) {
    return
  }

  owner = new ethers.Wallet( process.argv[2], new ethers.providers.JsonRpcProvider(authedURL));

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
    fs.writeFileSync('./authedtoken.txt', authedToken);
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

async function signEIP712Data(wallet, domain, types, message) {
  try {
    const signature = await wallet._signTypedData(domain, types, message);
    return signature;

  } catch (error) {
    console.error('Error signing data:', error);
  }
}

async function join_and_register(url, wallet) {
  // console.log('Joining the network ' + url)
  const jsonHeaders = { Accept: "application/json", "Content-Type": "application/json",};
  const joinResp = await fetch(`${url}/v1/join`, {
    method: 'GET',
    headers: jsonHeaders,
  });
  let token = await joinResp.text();
  // console.log('Joined the network with token ' + token)

  // console.log('Signing message for registration ' + wallet.address)

  const domain = {
    name: "Ten",
    version: "1.0",
    chainId: 443,
  }

  const types = {
    Authentication: [
      { name: "Encryption Token", type: "address" },
    ],
  };

  const message = {
    "Encryption Token": "0x" + token
  };

  signature = await signEIP712Data(wallet, domain, types, message);

  const requestBody = JSON.stringify({ signature: signature, address: wallet.address });
  console.log('Request Body:', requestBody);
  console.log("Request URL", `${url}/v1/authenticate/?token=${token}`)

  console.log('Authenticating account ' + wallet.address)

  authedURL = `${url}/v1/?token=${token}`
  authedToken = token
  const response = await fetch(`${url}/v1/authenticate/?token=${token}`, { // Added quotation marks around the URL
    method: 'POST',
    headers: jsonHeaders,
    body: requestBody,
  }).then(response => response.text())
      .then((response) => {
        console.log("Successfully setup Wallet Extension for " + wallet.address.toString())
      });
  return true
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
