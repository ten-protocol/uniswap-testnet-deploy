// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Default is ERC20 {
    constructor(string memory name, string memory initials, uint initialAmount) ERC20(name, initials) {
        _mint(msg.sender, initialAmount);
    }
}