/* eslint-disable no-undef */
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CreditToken", function () {
  let creditToken;
  let deployer, user1, user2;

  beforeEach(async function () {
    // Get accounts
    [deployer, user1, user2] = await ethers.getSigners();

    // Deploy the CreditToken contract with an initial supply
    const CreditToken = await ethers.getContractFactory("CreditToken");
    creditToken = await CreditToken.deploy(ethers.utils.parseUnits("1000", 18)); // Initial supply of 1000 tokens
    await creditToken.deployed();
  });

  it("should have correct initial supply and balance for deployer", async function () {
    // Check the deployer's balance after initial minting
    const deployerBalance = await creditToken.balanceOf(deployer.address);
    expect(deployerBalance).to.equal(ethers.utils.parseUnits("1000", 18));

    // Check total supply of the token
    const totalSupply = await creditToken.totalSupply();
    expect(totalSupply).to.equal(ethers.utils.parseUnits("1000", 18));
  });

  it("should allow the owner to mint new tokens", async function () {
    // Mint 500 new tokens to user1 from the deployer's account
    await creditToken.mint(user1.address, ethers.utils.parseUnits("500", 18));

    // Check user1's balance
    const user1Balance = await creditToken.balanceOf(user1.address);
    expect(user1Balance).to.equal(ethers.utils.parseUnits("500", 18));

    // Check updated total supply
    const totalSupply = await creditToken.totalSupply();
    expect(totalSupply).to.equal(ethers.utils.parseUnits("1500", 18));
  });

  it("should not allow non-owner accounts to mint tokens", async function () {
    const mintAmount = ethers.utils.parseUnits("100", 18); // Mint amount (100 tokens with 18 decimals)

    // Log the mintAmount using .toString() to avoid overflow
    console.log("Mint amount:", mintAmount.toString());

    // Try to mint tokens from a non-owner account (user1)
    console.log("Attempting to mint from non-owner account...");

    // Check if the transaction is reverted
    await expect(
      creditToken.connect(user1).mint(user1.address, mintAmount)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    // Check the balance without converting to a number
    const user1Balance = await creditToken.balanceOf(user1.address);
    console.log(
      "User1 balance after failed mint attempt:",
      user1Balance.toString()
    );
    expect(user1Balance).to.equal(ethers.BigNumber.from(0));
  });

  it("should allow token transfers between accounts", async function () {
    // Transfer 100 tokens from deployer to user1
    await creditToken.transfer(
      user1.address,
      ethers.utils.parseUnits("100", 18)
    );

    // Check user1's balance
    const user1Balance = await creditToken.balanceOf(user1.address);
    expect(user1Balance).to.equal(ethers.utils.parseUnits("100", 18));

    // Check deployer's balance after transfer
    const deployerBalance = await creditToken.balanceOf(deployer.address);
    expect(deployerBalance).to.equal(ethers.utils.parseUnits("900", 18));
  });

  it("should allow token approval and transferFrom by a spender", async function () {
    // Approve user1 to spend 200 tokens on behalf of the deployer
    await creditToken.approve(
      user1.address,
      ethers.utils.parseUnits("200", 18)
    );

    // Check the allowance
    const allowance = await creditToken.allowance(
      deployer.address,
      user1.address
    );
    expect(allowance).to.equal(ethers.utils.parseUnits("200", 18));

    // user1 transfers 150 tokens from deployer's account to user2
    await creditToken
      .connect(user1)
      .transferFrom(
        deployer.address,
        user2.address,
        ethers.utils.parseUnits("150", 18)
      );

    // Check balances after transfer
    const deployerBalance = await creditToken.balanceOf(deployer.address);
    const user2Balance = await creditToken.balanceOf(user2.address);
    expect(deployerBalance).to.equal(ethers.utils.parseUnits("850", 18));
    expect(user2Balance).to.equal(ethers.utils.parseUnits("150", 18));
  });
});
