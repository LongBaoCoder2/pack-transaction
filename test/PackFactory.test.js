const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PackFactory", function () {
  let packFactory;
  let owner;
  let packId = 1;
  let packPrice = ethers.utils.parseEther("100");
  let tokenAddress;

  before(async function () {
    // Get the PackFactory contract factory
    const PackFactory = await ethers.getContractFactory("PackFactory");

    // Deploy the PackFactory contract
    packFactory = await PackFactory.deploy();
    await packFactory.deployed();

    // Get the contract deployer (owner)
    [owner] = await ethers.getSigners();

    // Deploy a mock ERC20 token contract to use as a tokenAddress
    const MockToken = await ethers.getContractFactory("CreditToken");
    tokenAddress = (await MockToken.deploy()).address;
  });

  it("Should allow creating a new pack", async function () {
    // Create a new pack
    await expect(packFactory.createPack(packId, tokenAddress, packPrice))
      .to.emit(packFactory, "PackCreated")
      .withArgs(packId, tokenAddress, packPrice);

    // Verify that the pack was created with the correct details
    const pack = await packFactory.getPackDetails(packId);
    expect(pack.token).to.equal(tokenAddress);
    expect(pack.price).to.equal(packPrice);
  });

  it("Should not allow creating a pack with the same ID twice", async function () {
    // Attempt to create a pack with the same ID
    await expect(
      packFactory.createPack(packId, tokenAddress, packPrice)
    ).to.be.revertedWith("Pack ID already exists");
  });

  it("Should allow retrieving pack details", async function () {
    // Retrieve the pack details
    const pack = await packFactory.getPackDetails(packId);

    // Verify that the pack details match what was set during creation
    expect(pack.token).to.equal(tokenAddress);
    expect(pack.price).to.equal(packPrice);
  });

  it("Should not allow retrieving details of a non-existent pack", async function () {
    const nonExistentPackId = 999;
    await expect(
      packFactory.getPackDetails(nonExistentPackId)
    ).to.be.revertedWith("Pack does not exist");
  });
});
