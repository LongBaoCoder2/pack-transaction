// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PackFactory.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PackStore is PackFactory, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Store user purchases (On/Off-chain storage can be integrated externally)
    mapping(address => uint256[]) public userPackPurchases;

    // Function to get user pack purchases
    function getUserPackPurchases(address addr) public view returns (uint256[] memory) {
        return userPackPurchases[addr];
    }

    // Events to log purchases
    event PackPurchased(address indexed buyer, uint256 indexed packId);

    // Buy pack using native token (e.g., ETH)
    function buyPackWithNative(uint256 packId) public payable nonReentrant {
        Pack memory pack = getPackDetails(packId);
        require(msg.value >= pack.price, "Insufficient funds sent");
        
        // Check if a specific owner is required and that the sender matches
        if (pack.requiredOwner != address(0)) {
            require(msg.sender == pack.requiredOwner, "Not authorized to buy this pack");
        }

        // Store the purchase
        userPackPurchases[msg.sender].push(packId);

        // Emit the purchase event
        emit PackPurchased(msg.sender, packId);
    }

    // Buy pack using ERC-20 token
    function buyPackWithToken(uint256 packId, address tokenAddress) public nonReentrant {
        Pack memory pack = getPackDetails(packId);
        require(tokenAddress == pack.token, "Invalid token address");
        
        // Check if a specific owner is required and that the sender matches
        if (pack.requiredOwner != address(0)) {
            require(msg.sender == pack.requiredOwner, "Not authorized to buy this pack");
        }

        IERC20 token = IERC20(tokenAddress);
        token.safeTransferFrom(msg.sender, address(this), pack.price);

        // Store the purchase
        userPackPurchases[msg.sender].push(packId);
        
        // Emit the purchase event
        emit PackPurchased(msg.sender, packId);
    }

    // Function to withdraw collected native tokens by an admin
    function withdraw() public onlyRole(ADMIN_ROLE) nonReentrant {
        payable(msg.sender).transfer(address(this).balance);
    }

    // Function to withdraw ERC-20 tokens by an admin
    function withdrawTokens(address tokenAddress) public onlyRole(ADMIN_ROLE) nonReentrant {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        token.safeTransfer(msg.sender, balance);
    }
}
