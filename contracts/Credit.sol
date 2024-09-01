// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CreditToken is ERC20, Ownable {
    // Constructor to initialize the token and mint initial supply to the owner
    constructor(uint256 initialSupply) ERC20("CreditToken", "CREDIT") {
        _mint(msg.sender, initialSupply);
    }

    // Function for the owner to mint additional tokens
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}