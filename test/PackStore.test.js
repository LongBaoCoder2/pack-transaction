/* eslint-disable no-undef */
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PackFactory Contract", function () {
  let packFactory, creditToken, deployer, user1, user2;

  beforeEach(async function () {
    [deployer, user1, user2] = await ethers.getSigners();

    // Deploy CreditToken contract (mock ERC-20 token)
    const CreditToken = await ethers.getContractFactory("CreditToken");
    creditToken = await CreditToken.deploy(ethers.utils.parseUnits("1000", 18)); // 1000 tokens with 18 decimals
    await creditToken.deployed();

    // Deploy PackFactory contract
    const PackFactory = await ethers.getContractFactory("PackFactory");
    packFactory = await PackFactory.deploy();
    await packFactory.deployed();
  });

  it("should configure a pack with native tokens (ETH)", async function () {
    // Configure a pack to be purchased with native tokens
    await packFactory.configurePack(
      1,
      "NativePack",
      1, // packType = 1 (Standard)
      ethers.utils.parseEther("1"), // Price: 1 ETH
      ethers.constants.AddressZero, // No ERC-20 token
      deployer.address // Required owner (optional)
    );

    // Verify that the pack is correctly configured
    const packDetails = await packFactory.getPackDetails(1);
    expect(packDetails.id).to.equal(1);
    expect(packDetails.name).to.equal("NativePack");
    expect(packDetails.price).to.equal(ethers.utils.parseEther("1"));
    expect(packDetails.token).to.equal(ethers.constants.AddressZero);
  });

  it("should configure a pack with ERC-20 tokens", async function () {
    const packPrice = ethers.utils.parseUnits("100", 18); // Pack price in ERC-20 token (100 tokens)

    // Configure a pack to be purchased with ERC-20 tokens
    await packFactory.configurePack(
      2,
      "ERC20Pack",
      2, // packType = 2 (Deluxe)
      packPrice,
      creditToken.address, // Use the deployed ERC-20 token
      deployer.address // Required owner (optional)
    );

    // Verify that the pack is correctly configured
    const packDetails = await packFactory.getPackDetails(2);
    expect(packDetails.id).to.equal(2);
    expect(packDetails.name).to.equal("ERC20Pack");
    expect(packDetails.price).to.equal(packPrice);
    expect(packDetails.token).to.equal(creditToken.address);
  });

  it("should allow the owner to remove a pack", async function () {
    // Configure and then remove a pack
    await packFactory.configurePack(
      4,
      "RemovablePack",
      1,
      ethers.utils.parseEther("1"),
      ethers.constants.AddressZero,
      deployer.address
    );

    await packFactory.removePack(4);

    // Verify that the pack has been removed
    const packDetails = await packFactory.getPackDetails(4);
    expect(packDetails.id).to.equal(0); // The pack should no longer exist (depending on how your remove logic works)
  });
});
