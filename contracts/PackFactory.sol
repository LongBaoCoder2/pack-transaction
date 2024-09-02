// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PackFactory is AccessControl {
    // Define roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Struct to hold Pack information, optimized for gas efficiency
    struct Pack {
        uint256 id;
        uint256 price;         // Price of the pack
        uint256 packType;      // Id of the packType
        address token;         // Token address (if non-native token is used)
        address requiredOwner; // Optional owner restriction
        string name;
        // bool isNative;         // True if pack is purchased using native token (e.g., ETH)
    }

    // Mapping from Pack ID to Pack details
    mapping(uint256 => Pack) public packs;

    // Events to log pack creation or updates
    event PackConfigured(uint256 indexed packId, uint256 packType, uint256 price);
    event PackRemoved(uint256 indexed packId);

    // Constructor to set up the initial admin role
    constructor(address admin) {
        // Grant the admin role to the deployer and the provided admin address
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        // Set ADMIN_ROLE as its own admin role
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
    }

    // Modifier to restrict access to admin-only functions
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _;
    }

    // Function to add or update a Pack configuration, restricted to admins
    function configurePack(
        uint256 _id, 
        string memory _name, 
        uint256 _packType, 
        uint256 _price, 
        address _token, 
        address _requiredOwner
    ) public onlyAdmin {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_price > 0, "Price must be greater than zero");
        require(_token != address(0), "Invalid token address for non-native token");

        packs[_id] = Pack({
            id: _id,
            name: _name,
            packType: _packType,
            price: _price,
            token: _token,
            requiredOwner: _requiredOwner
        });

        // Emit event with minimal data to save gas
        emit PackConfigured(_id, _packType, _price);
    }

    // Function to get pack details
    function getPackDetails(uint256 packId) public view returns (Pack memory) {
        return packs[packId];
    }

    // Function to remove a pack, restricted to admins
    function removePack(uint256 _id) public onlyAdmin {
        delete packs[_id];
        emit PackRemoved(_id);
    }
}
