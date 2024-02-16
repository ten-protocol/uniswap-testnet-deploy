# Uniswap Testnet Deploy
This repo is for deploying a Uniswap testnet instance to the TEN testnet.

The Uniswap testnet instance is a fork of the Uniswap v3 core contracts. The forked contracts are modified to work with the TEN testnet.

The scripts will deploy contract of various testnet tokens, and then deploy the Uniswap testnet instance to allow for trading of these tokens.

## 1. Prerequisites
- Node.js
- Python
- Yarn

### For local environment
- a Ten testnet running on your local machine (see [TEN Testnet](https://github.com/ten-protocol/go-ten/tree/main/testnet)). [`./testnet-local-build_images.sh`, `go run ./launcher/cmd`]

## 2. Deployment Flow

There are two basic environments for deploying the Uniswap testnet instance. The first is the local environment, which is used for testing and development. The second is the remote environment, which is used for deploying the Uniswap testnet instance to the TEN testnet.

### 2a. deploy.sh (deploy-local.sh for local environment)

1. Runs an instance of wallet-extension (personal Gateway) to interact with the TEN testnet.
2. Funds the uniswap owner account with testnet tokens.
3. Deploys the custom tokens (ERC20) to the TEN testnet. (2b)
4. Updates an externally accessible URI with a tokenlist of the deployed testnet tokens.
5. Deploys the Uniswap testnet instance to the TEN testnet.
6. Builds the smart order router and deploys it (It searches for the most efficient way to swap token A for token B, considering splitting swaps across multiple routes and gas costs.)
7. Deploys the Uniswap Interface to the TEN testnet.

### 2b. /erc20deployer/scripts/deploy.js

- Specify your token details in the `tokens` array.
- Writes tokenlist for the deployed testnet tokens to a static file for upload to external URI.
- Deploys the custom tokens (ERC20) to the TEN testnet.
