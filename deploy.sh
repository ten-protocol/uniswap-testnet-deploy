#!/usr/bin/env bash

#
# This script deploys Uniswap to the obscuro network
#

# Ensure any fail is loud and explicit
set -euo pipefail

help_and_exit() {
    echo ""
    echo "Usage: "
    echo "   ex: (run locally)"
    echo "      -  $(basename "${0}") "
    echo ""
    echo "  wallet_ext_host        *Optional* Sets host to which the WE connects to. Defaults to testnet"
    echo ""
    echo ""
    echo ""
    exit 1  # Exit with error explicitly
}

# Obscuro constants file is built on the fly
obscuro_constants_file="/* eslint-disable */ \n"

# Define local usage vars
root_path="$(cd "$(dirname "${0}")" && pwd)"
build_path="${root_path}/build"
erc20_path="${root_path}/erc20deployer"
wallet_ext_path="${build_path}/go-obscuro/tools/walletextension/main"
uniswap_deployer_path="${build_path}/uniswap-deploy-v3"
uniswap_sor_path="${build_path}/uniswap-smart-order-router"
uniswap_interface_path="${build_path}/uniswap-interface"
we_host="testnet.obscu.ro"


# Fetch options
for argument in "$@"
do
    key=$(echo $argument | cut -f1 -d=)
    value=$(echo $argument | cut -f2 -d=)

    case "$key" in
            --we_host)                we_host=${value} ;;

            --help)                     help_and_exit ;;
            *)
    esac
done
# create temp build path
mkdir -p "${build_path}"

# setup and run the wallet extension
cd "${build_path}"
git clone -b main --single-branch https://github.com/obscuronet/go-obscuro
cd "${wallet_ext_path}"
nohup go build . && ./main -port 3001 -nodeHost "${we_host}"  &
sleep 30s
echo "Waiting for Wallet Extension..."

# deploy the erc20contracts
cd "${erc20_path}"
yarn && npx hardhat compile && node scripts/deploy.js
erc20_state=$(cat state.json)
obscuro_constants_file+="export const erc20state =${erc20_state}\n"
echo "${erc20_state}"
sleep 30s
echo "Waiting for erc20 contracts..."

# deploy the uniswap contracts
cd "${build_path}"
git clone -b main --single-branch https://github.com/obscuronet/uniswap-deploy-v3
cd "${uniswap_deployer_path}"
yarn && yarn start -pk 0x8dfb8083da6275ae3e4f41e3e8a8c19d028d32c9247e24530933782f2a05035b -j http://127.0.0.1:3001/ -w9 0x890e32E4b52915819E36A3A085Bd466b3e518d18 -ncl ETH -o 0x13E23Ca74DE0206C56ebaE8D51b5622EFF1E9944
deploy_state=$(cat state.json)
obscuro_constants_file+="export const state = ${deploy_state}"
echo ts_deploy_state
sleep 30s
echo "Waiting for swap contracts..."

# build the smart-order-router
cd "${build_path}"
git clone -b obscuro --single-branch https://github.com/obscuronet/uniswap-smart-order-router
cd "${uniswap_sor_path}"
echo -e "${obscuro_constants_file}" > src/obscuro_constants_1.ts
cat src/obscuro_constants.ts |tail -n+4>> src/obscuro_constants_1.ts
mv src/obscuro_constants_1.ts src/obscuro_constants.ts
npm install && npm run build && npm pack
sleep 10s
echo "Waiting for smart-order-router..."


# build the interface
cd "${build_path}"
git clone -b obscuro --single-branch https://github.com/obscuronet/uniswap-interface
cd "${uniswap_interface_path}"
echo -e "${obscuro_constants_file}" > src/obscuro_constants_1.ts
cat src/obscuro_constants.ts |tail -n+4>> src/obscuro_constants_1.ts
mv src/obscuro_constants_1.ts src/obscuro_constants.ts
cp -f "${uniswap_sor_path}/uniswap-smart-order-router-2.9.3.tgz" .
yarn && yarn start





