// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract CreditToken is Initializable, ERC20Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    // Constructor equivalent for upgradeable contracts
    function initialize(uint256 initialSupply) public initializer {
        __ERC20_init("CreditToken", "CREDIT");
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        _mint(msg.sender, initialSupply);
    }

    // Function for the owner to mint additional tokens
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Authorization function to control who can upgrade the contract
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
