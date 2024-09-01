// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PackStore is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Struct to hold Pack information
    struct Pack {
        uint256 id;
        string name;
        string packType;
        uint256 price;         // Price of the pack
        address token;         // Token address (if non-native token is used)
        bool isNative;         // True if pack is purchased using native token (e.g., ETH)
    }

    // Mapping from Pack ID to Pack details
    mapping(uint256 => Pack) public packs;

    // Store user purchases (On/Off-chain storage can be integrated externally)
    mapping(address => uint256[]) public userPackPurchases;

    // Events to log purchases
    event PackPurchased(address indexed buyer, uint256 indexed packId, string packType, uint256 price, address token);

    // Function to add or update a Pack configuration by the contract owner
    function configurePack(
        uint256 _id, 
        string memory _name, 
        string memory _packType, 
        uint256 _price, 
        address _token, 
        bool _isNative
    ) public onlyOwner {
        packs[_id] = Pack({
            id: _id,
            name: _name,
            packType: _packType,
            price: _price,
            token: _token,
            isNative: _isNative
        });
    }

    // Buy pack using native token (e.g., ETH)
    function buyPackWithNative(uint256 packId) public payable nonReentrant {
        Pack memory pack = packs[packId];
        require(pack.isNative, "This pack is not sold with native token");
        require(msg.value >= pack.price, "Insufficient funds sent");

        // Store the purchase
        userPackPurchases[msg.sender].push(packId);

        // Emit the purchase event
        emit PackPurchased(msg.sender, packId, pack.packType, pack.price, address(0));
    }

    // Buy pack using ERC-20 token
    function buyPackWithToken(uint256 packId, address tokenAddress) public nonReentrant {
        Pack memory pack = packs[packId];
        require(!pack.isNative, "This pack is sold using native token");
        require(tokenAddress == pack.token, "Invalid token address");

        IERC20 token = IERC20(tokenAddress);
        token.safeTransferFrom(msg.sender, address(this), pack.price);

        // Store the purchase
        userPackPurchases[msg.sender].push(packId);

        // Emit the purchase event
        emit PackPurchased(msg.sender, packId, pack.packType, pack.price, tokenAddress);
    }

    // Function to withdraw collected native tokens by owner
    function withdraw() public onlyOwner nonReentrant {
        payable(owner()).transfer(address(this).balance);
    }

    // Function to withdraw ERC-20 tokens by owner
    function withdrawTokens(address tokenAddress) public onlyOwner nonReentrant {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        token.safeTransfer(owner(), balance);
    }
}
