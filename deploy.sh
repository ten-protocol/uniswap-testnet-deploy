#!/usr/bin/env bash

#
# This script deploys Uniswap to the obscuro network
#

# Ensure any fail is loud and explicit
set -euo pipefail

help_and_exit() {
    echo ""
    echo "Usage: "
    echo "   ex: (run locally) --we_host=host.docker.internal --faucet_addr=host.docker.internal"
    echo "      -  $(basename "${0}") "
    echo ""
    echo "  we_host          *Optional* Sets host to which the WE connects to. Defaults to testnet"
    echo ""
    echo "  pk_string        *Optional* Sets the private key to deploy contracts. Defaults to 0x8dfb8083da6275ae3e4f41e3e8a8c19d028d32c9247e24530933782f2a05035b"
    echo ""
    echo "  addr             *Optional* Sets the account addr to fund and own the uniswap contracts. Defaults to 0xA58C60cc047592DE97BF1E8d2f225Fc5D959De77"
    echo ""
    echo "  faucet_addr      *Optional* Sets faucet address. Defaults to testnet-faucet.uksouth.azurecontainer.io"
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
wallet_ext_path="${build_path}/go-ten/tools/walletextension/main"
uniswap_deployer_path="${build_path}/uniswap-deploy-v3"
uniswap_sor_path="${build_path}/uniswap-smart-order-router"
uniswap_interface_path="${build_path}/uniswap-interface"
we_host="testnet.obscu.ro" # host.docker.internal for docker instances connecting back to localhost
pk_string="0x8dfb8083da6275ae3e4f41e3e8a8c19d028d32c9247e24530933782f2a05035b"
owner_addr="0xA58C60cc047592DE97BF1E8d2f225Fc5D959De77"
faucet_addr="dev-testnet-faucet.uksouth.azurecontainer.io"



# Fetch options
for argument in "$@"
do
    key=$(echo $argument | cut -f1 -d=)
    value=$(echo $argument | cut -f2 -d=)

    case "$key" in
            --we_host)                  we_host=${value} ;;
            --pk_string)                pk_string=${value} ;;
            --addr)                     owner_addr=${value} ;;

            --help)                     help_and_exit ;;
            *)
    esac
done
# create temp build path
mkdir -p "${build_path}"

# setup and run the wallet extension
cd "${build_path}"
git clone -b main --single-branch https://github.com/ten-protocol/go-ten
cd "${wallet_ext_path}"
go build . && ./main -port 4001 -nodeHost "${we_host}"  &
echo "Waiting for Wallet Extension..."
echo ""
sleep 30s

# fund the address
curl --request POST "http://${faucet_addr}/fund/eth" --header 'Content-Type: application/json' \
--data-raw "{ \"address\":\"${owner_addr}\" }"
echo "Waiting for Faucet Funding..."
echo ""
sleep 60s

# deploy the erc20contracts
cd "${erc20_path}"
yarn && npx hardhat compile
node scripts/deploy.js "${pk_string}"
erc20_state=$(cat state.json)
authed_token=$(<authedtoken.txt)
obscuro_constants_file+="export const erc20state =${erc20_state}\n"
echo "${erc20_state}"
erc20_WETH=$(jq -r  ".WETHAddress" state.json)
echo "WETH: ${erc20_WETH}"
echo "Waiting for erc20 contracts..."
echo ""
sleep 30s

# update tokenlist
echo "Updating tokenlist.."
curl https://kvdb.io/WVNLPGWE94wkw7TRv3vAFc/token_testnet_001 -H "Content-Type: application/json" -d @tokenlist.json

# deploy the uniswap contracts
cd "${build_path}"
git clone -b main --single-branch https://github.com/ten-protocol/uniswap-deploy-v3
cd "${uniswap_deployer_path}"
yarn && yarn start -pk "${pk_string}" -j http://127.0.0.1:4001/v1/${authed_token} -w9 "${erc20_WETH}" -ncl ETH -o "${owner_addr}"
deploy_state=$(cat state.json)
obscuro_constants_file+="export const state = ${deploy_state}"
echo ts_deploy_state
echo "Waiting for swap contracts..."
echo ""
sleep 30s

# build the smart-order-router
cd "${build_path}"
git clone -b obscuro --single-branch https://github.com/ten-protocol/uniswap-smart-order-router
cd "${uniswap_sor_path}"
echo -e "${obscuro_constants_file}" > src/obscuro_constants_1.ts
cat src/obscuro_constants.ts | tail -n+4>> src/obscuro_constants_1.ts
mv src/obscuro_constants_1.ts src/obscuro_constants.ts
npm install && npm run build && npm pack
sleep 10s
echo "Waiting for smart-order-router..."


# build the interface
cd "${build_path}"
git clone -b obscuro --single-branch https://github.com/ten-protocol/uniswap-interface
cd "${uniswap_interface_path}"
echo -e "${obscuro_constants_file}" > src/obscuro_constants_1.ts
cat src/obscuro_constants.ts |tail -n+4>> src/obscuro_constants_1.ts
mv src/obscuro_constants_1.ts src/obscuro_constants.ts
cp -f "${uniswap_sor_path}/uniswap-smart-order-router-2.9.3.tgz" .
yarn && yarn build && serve -s build -l 80 -n





