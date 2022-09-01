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
    { name: "Obscuro Tokens", token: "OBX"},
    { name: "USDC", token: "USDC"},
  ]) {
    let address = await deployContract(owner, contract, mintedAmount);
    state[contract.token+"Address"] = address.toString()
  }
  console.log( JSON.stringify(state,null,''));

  try {
    fs.writeFileSync('./state.json', JSON.stringify(state,null,''));
    // file written successfully
  } catch (err) {
    console.error(err);
  }

}

async function deployContract(addr, contractDetails, mintAmount) {
  const contract = await ethers.getContractFactory("ERC20Default");
  console.log("Address: " + owner.address.toString() +" Deploying Contract: " + contractDetails.name);
  const contractDeployed = await contract.connect(addr).deploy(contractDetails.name, contractDetails.token, mintAmount);

  // test the contract is responding correctly
  expect(await contractDeployed.totalSupply()).to.equal(mintAmount);
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
