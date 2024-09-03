const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CreditToken and PackStore", function () {
  let creditToken, packStore;
  let owner, addr1, addr2;
  let packId = 1;
  let initialSupply = ethers.utils.parseEther("1000000");

  before(async function () {
    // Deploy the CreditToken contract
    const CreditToken = await ethers.getContractFactory("CreditToken");
    creditToken = await CreditToken.deploy();
    await creditToken.initialize(initialSupply);

    // Deploy the PackFactory library
    const PackFactory = await ethers.getContractFactory("PackFactory");
    const packFactory = await PackFactory.deploy();
    await packFactory.deployed();

    // Deploy the PackStore contract
    const PackStore = await ethers.getContractFactory("PackStore", {
      libraries: {
        PackFactory: packFactory.address,
      },
    });

    [owner, addr1, addr2] = await ethers.getSigners();
    packStore = await PackStore.deploy();
    await packStore.deployed();

    // Create a pack for testing
    await packStore.createPack(
      packId,
      creditToken.address,
      ethers.utils.parseEther("100")
    );
  });

  it("Should initialize the CreditToken contract", async function () {
    expect(await creditToken.name()).to.equal("CreditToken");
    expect(await creditToken.symbol()).to.equal("CREDIT");
    expect(await creditToken.totalSupply()).to.equal(initialSupply);
    expect(await creditToken.balanceOf(owner.address)).to.equal(initialSupply);
  });

  it("Should allow the owner to mint additional tokens", async function () {
    const mintAmount = ethers.utils.parseEther("5000");
    await creditToken.mint(addr1.address, mintAmount);
    expect(await creditToken.balanceOf(addr1.address)).to.equal(mintAmount);
  });

  it("Should allow a user to buy a pack from the system", async function () {
    // Approve token transfer
    await creditToken
      .connect(addr1)
      .approve(packStore.address, ethers.utils.parseEther("100"));

    // Buy pack with tokens from the system
    await packStore
      .connect(addr1)
      .buyPackWithTokenFromSystem(packId, creditToken.address);

    // Verify ownership
    expect(await packStore.getPackOwner(packId)).to.equal(addr1.address);
  });

  it("Should allow a user to buy a pack from another user", async function () {
    const price = ethers.utils.parseEther("150");

    // Approve token transfer
    await creditToken.connect(addr2).approve(packStore.address, price);

    // Buy pack with tokens from another user
    await packStore
      .connect(addr2)
      .buyPackWithTokenFromUser(packId, creditToken.address, price);

    // Verify ownership transfer
    expect(await packStore.getPackOwner(packId)).to.equal(addr2.address);
  });

  it("Should not allow a user to buy their own pack", async function () {
    const price = ethers.utils.parseEther("150");

    // Attempt to buy own pack
    await expect(
      packStore
        .connect(addr2)
        .buyPackWithTokenFromUser(packId, creditToken.address, price)
    ).to.be.revertedWith("Cannot buy your own pack");
  });

  it("Should not allow buying an unowned pack", async function () {
    const invalidPackId = 999;
    const price = ethers.utils.parseEther("100");

    await expect(
      packStore
        .connect(addr1)
        .buyPackWithTokenFromUser(invalidPackId, creditToken.address, price)
    ).to.be.revertedWith("Pack not owned");
  });

  it("Should allow the admin to withdraw tokens", async function () {
    const initialBalance = await creditToken.balanceOf(owner.address);

    // Withdraw tokens
    await packStore.connect(owner).withdrawTokens(creditToken.address);

    // Check balance after withdrawal
    const finalBalance = await creditToken.balanceOf(owner.address);
    expect(finalBalance).to.be.gt(initialBalance);
  });
});
