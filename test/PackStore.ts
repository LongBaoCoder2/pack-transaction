// Load dependencies
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PackStore", function () {
  let PackStore, packStore, owner, addr1, addr2;
  let mockERC20Token,
    packId = 1;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy a mock ERC20 token for testing token-based purchases
    const MockERC20 = await ethers.getContractFactory(
      "ERC20PresetMinterPauser"
    );
    mockERC20Token = await MockERC20.deploy("MockToken", "MTKN");
    await mockERC20Token.mint(addr1.address, ethers.utils.parseEther("1000"));

    // Deploy the PackStore contract
    PackStore = await ethers.getContractFactory("PackStore");
    packStore = await PackStore.deploy();
    await packStore.deployed();

    // Configure a pack that can be bought using native tokens (e.g., ETH)
    await packStore.configurePack(
      packId,
      "Starter Pack",
      "Basic",
      ethers.utils.parseEther("1"),
      ethers.constants.AddressZero,
      true
    );

    // Configure a pack that can be bought using ERC-20 tokens
    await packStore.configurePack(
      2,
      "Premium Pack",
      "Advanced",
      ethers.utils.parseEther("10"),
      mockERC20Token.address,
      false
    );
  });

  describe("Configure Pack", function () {
    it("Should configure a new pack", async function () {
      const pack = await packStore.packs(packId);
      expect(pack.name).to.equal("Starter Pack");
      expect(pack.packType).to.equal("Basic");
      expect(pack.price.toString()).to.equal(
        ethers.utils.parseEther("1").toString()
      );
      expect(pack.isNative).to.equal(true);
    });
  });

  describe("Buy Pack with Native Token", function () {
    it("Should allow user to buy pack using native token", async function () {
      // Addr1 buys the pack using native tokens (ETH)
      await packStore
        .connect(addr1)
        .buyPackWithNative(packId, { value: ethers.utils.parseEther("1") });

      // Check if purchase was recorded
      const userPacks = await packStore.userPackPurchases(addr1.address);
      expect(userPacks.length).to.equal(1);
      expect(userPacks[0]).to.equal(packId);

      // Check contract balance is correct
      expect(await ethers.provider.getBalance(packStore.address)).to.equal(
        ethers.utils.parseEther("1")
      );
    });

    it("Should revert if insufficient funds are sent", async function () {
      // Attempt to buy pack with insufficient ETH
      await expect(
        packStore
          .connect(addr1)
          .buyPackWithNative(packId, { value: ethers.utils.parseEther("0.5") })
      ).to.be.revertedWith("Insufficient funds sent");
    });
  });

  describe("Buy Pack with ERC20 Token", function () {
    it("Should allow user to buy pack using ERC20 tokens", async function () {
      // Approve the PackStore contract to spend addr1's tokens
      await mockERC20Token
        .connect(addr1)
        .approve(packStore.address, ethers.utils.parseEther("10"));

      // Addr1 buys the pack using ERC20 tokens
      await packStore
        .connect(addr1)
        .buyPackWithToken(2, mockERC20Token.address);

      // Check if purchase was recorded
      const userPacks = await packStore.userPackPurchases(addr1.address);
      expect(userPacks.length).to.equal(1);
      expect(userPacks[0]).to.equal(2);

      // Check if the ERC20 tokens were transferred to the contract
      const contractBalance = await mockERC20Token.balanceOf(packStore.address);
      expect(contractBalance.toString()).to.equal(
        ethers.utils.parseEther("10").toString()
      );
    });

    it("Should revert if token address is incorrect", async function () {
      // Attempt to buy pack using the wrong token address
      await expect(
        packStore.connect(addr1).buyPackWithToken(2, addr2.address) // Wrong token address
      ).to.be.revertedWith("Invalid token address");
    });
  });

  describe("Withdrawals", function () {
    it("Should allow owner to withdraw native tokens", async function () {
      // Addr1 buys a pack using native tokens (ETH)
      await packStore
        .connect(addr1)
        .buyPackWithNative(packId, { value: ethers.utils.parseEther("1") });

      // Owner withdraws funds
      await expect(() => packStore.withdraw()).to.changeEtherBalance(
        owner,
        ethers.utils.parseEther("1")
      );
    });

    it("Should allow owner to withdraw ERC20 tokens", async function () {
      // Addr1 approves and buys a pack using ERC20 tokens
      await mockERC20Token
        .connect(addr1)
        .approve(packStore.address, ethers.utils.parseEther("10"));
      await packStore
        .connect(addr1)
        .buyPackWithToken(2, mockERC20Token.address);

      // Owner withdraws ERC20 tokens
      const ownerBalanceBefore = await mockERC20Token.balanceOf(owner.address);
      await packStore.withdrawTokens(mockERC20Token.address);
      const ownerBalanceAfter = await mockERC20Token.balanceOf(owner.address);

      expect(ownerBalanceAfter.sub(ownerBalanceBefore).toString()).to.equal(
        ethers.utils.parseEther("10").toString()
      );
    });
  });
});
