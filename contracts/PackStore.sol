// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PackFactory.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PackStore is PackFactory, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Store user purchases (On/Off-chain storage can be integrated externally)
    mapping(address => mapping(uint256 => bool)) private userPackOwnership;
    mapping(uint256 => address) private packOwners;

    // Function to check if a user owns a specific pack
    function doesUserOwnPack(address user, uint256 packId) public view returns (bool) {
        return userPackOwnership[user][packId];
    }

    // Function to get the owner of a specific pack
    function getPackOwner(uint256 packId) public view returns (address) {
        return packOwners[packId];
    }

    // Events to log purchases and sales
    event PackPurchased(address indexed buyer, uint256 indexed packId);
    event PackSold(address indexed seller, address indexed buyer, uint256 indexed packId, uint256 price);

    // Buy pack using native token (e.g., ETH)
    // function buyPackWithNative(uint256 packId) public payable nonReentrant {
    //     Pack memory pack = getPackDetails(packId);
    //     require(msg.value >= pack.price, "Insufficient funds sent");

    //     // Check if the pack already has an owner
    //     require(packOwners[packId] == address(0), "Pack already purchased");

    //     // Store the purchase
    //     userPackOwnership[msg.sender][packId] = true;
    //     packOwners[packId] = msg.sender;

    //     // Emit the purchase event
    //     emit PackPurchased(msg.sender, packId);
    // }

    // Buy pack using ERC-20 token
    function buyPackWithTokenFromSystem(uint256 packId, address tokenAddress) public nonReentrant {
        Pack memory pack = getPackDetails(packId);
        require(tokenAddress == pack.token, "Invalid token address");

        // Check if the pack already has an owner
        require(packOwners[packId] == address(0), "Pack already purchased");

        IERC20 token = IERC20(tokenAddress);
        token.safeTransferFrom(msg.sender, address(this), pack.price);

        // Store the purchase
        userPackOwnership[msg.sender][packId] = true;
        packOwners[packId] = msg.sender;
        
        // Emit the purchase event
        emit PackPurchased(msg.sender, packId);
    }

    // Function for one user to buy a pack from another user
    function buyPackWithTokenFromUser(uint256 packId, address tokenAddress, uint256 price) public nonReentrant {
        address seller = packOwners[packId];

        // Ensure the pack has an owner and the caller is not the current owner
        require(seller != address(0), "Pack not owned");
        require(seller != msg.sender, "Cannot buy your own pack");

        // Transfer tokens from buyer to seller
        IERC20 token = IERC20(tokenAddress);
        token.safeTransferFrom(msg.sender, seller, price);

        // Transfer ownership of the pack to the buyer
        userPackOwnership[seller][packId] = false;
        userPackOwnership[msg.sender][packId] = true;
        packOwners[packId] = msg.sender;

        // Emit the sale event
        emit PackSold(seller, msg.sender, packId, price);
    }

    // Function to withdraw collected native tokens by an admin
    // function withdraw() public onlyRole(ADMIN_ROLE) nonReentrant {
    //     payable(msg.sender).transfer(address(this).balance);
    // }

    // Function to withdraw ERC-20 tokens by an admin
    function withdrawTokens(address tokenAddress) public onlyRole(ADMIN_ROLE) nonReentrant {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        token.safeTransfer(msg.sender, balance);
    }
}
