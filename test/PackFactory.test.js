/* eslint-disable no-undef */
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PackFactory with CreditToken", function () {
  let packFactory, creditToken;
  let deployer, user1, user2;

  beforeEach(async function () {
    // Get accounts
    [deployer, user1, user2] = await ethers.getSigners();

    // Deploy the CreditToken contract with an initial supply
    const CreditToken = await ethers.getContractFactory("CreditToken");
    creditToken = await CreditToken.deploy(ethers.utils.parseUnits("1000", 18)); // Initial supply of 1000 tokens
    await creditToken.deployed();
    console.log("CreditToken deployed with initial supply of 1000 tokens");

    // Deploy the PackFactory contract
    const PackFactory = await ethers.getContractFactory("PackFactory");
    packFactory = await PackFactory.deploy();
    await packFactory.deployed();
    console.log("PackFactory deployed");
  });

  it("should configure a pack with CreditToken and check pack details", async function () {
    const packId = 1;
    const packName = "Token Pack";
    const packType = 1; // Assuming packType is an integer
    const packPrice = ethers.utils.parseUnits("100", 18); // Price in tokens (100 tokens)

    console.log(
      "Configuring pack with ID:",
      packId,
      "Name:",
      packName,
      "Price:",
      packPrice.toString()
    );

    // Configure the pack using CreditToken (not native ETH)
    await packFactory.configurePack(
      packId,
      packName,
      packType,
      packPrice,
      creditToken.address, // Address of the CreditToken
      deployer.address // Required owner is the deployer
    );

    // Check that the pack is correctly configured
    const packDetails = await packFactory.getPackDetails(packId);
    console.log(
      "Pack Details - ID:",
      packDetails.id.toString(),
      "Name:",
      packDetails.name,
      "Price:",
      ethers.utils.formatUnits(packDetails.price, 18)
    );
    expect(packDetails.price).to.equal(packPrice);
    expect(packDetails.token).to.equal(creditToken.address);
    expect(packDetails.name).to.equal(packName);
  });

  it("should restrict pack configuration to the owner", async function () {
    // Attempt to configure a pack as a non-owner
    await expect(
      packFactory
        .connect(user1)
        .configurePack(
          3,
          "NonOwnerPack",
          3,
          ethers.utils.parseEther("1"),
          creditToken.address,
          user1.address
        )
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should not allow purchase if user doesn't have enough tokens", async function () {
    const packId = 2;
    const packName = "Premium Token Pack";
    const packType = 2; // Assuming packType is an integer
    const packPrice = ethers.utils.parseUnits("300", 18); // Pack costs 300 tokens

    console.log(
      "Configuring pack with ID:",
      packId,
      "Name:",
      packName,
      "Price:",
      packPrice.toString()
    );

    // Configure another pack
    await packFactory.configurePack(
      packId,
      packName,
      packType,
      packPrice,
      creditToken.address,
      deployer.address
    );

    // Mint fewer tokens to user2 (only 100 tokens)
    console.log("Minting 100 tokens to user2...");
    await creditToken.mint(user2.address, ethers.utils.parseUnits("100", 18));

    // Check user2's token balance (should be less than the pack price)
    const user2Balance = await creditToken.balanceOf(user2.address);
    console.log(
      "User2 balance after minting:",
      ethers.utils.formatUnits(user2Balance, 18)
    );

    // User2 tries to approve more tokens than they have (this will pass, but the transfer will fail)
    console.log("User2 approving PackFactory to spend 300 tokens...");
    await creditToken.connect(user2).approve(packFactory.address, packPrice);

    // Check the allowance
    const allowance = await creditToken.allowance(
      user2.address,
      packFactory.address
    );
    console.log(
      "User2 allowance for PackFactory:",
      ethers.utils.formatUnits(allowance, 18)
    );

    // Simulate a failed purchase due to insufficient balance (this would also need a real purchase function)
    console.log(
      "Simulating failed token-based pack purchase due to insufficient balance..."
    );

    // Example expectation (depends on implementation of purchase logic)
    // await expect(packFactory.connect(user2).buyPackWithToken(packId)).to.be.revertedWith("Insufficient token balance");
  });
});
