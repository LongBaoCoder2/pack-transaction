// import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// const JAN_1ST_2030 = 1893456000;
// const ONE_GWEI: bigint = 1_000_000_000n;

// const LockModule = buildModule("LockModule", (m) => {
//   const unlockTime = m.getParameter("unlockTime", JAN_1ST_2030);
//   const lockedAmount = m.getParameter("lockedAmount", ONE_GWEI);

//   const lock = m.contract("Lock", [unlockTime], {
//     value: lockedAmount,
//   });

//   return { lock };
// });

// export default LockModule;

// async function main() {
//   const Box = await ethers.getContractFactory("Box");
//   console.log("Deploying Box...");
//   const box = await upgrades.deployProxy(Box, [42], { initializer: 'store' });
//   console.log("Box deployed to:", box.address);
// }

// main()
//   .then(() => process.exit(0))
//   .catch(error => {
//     console.error(error);
//     process.exit(1);
//   });

import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";

async function main(): Promise<void> {
  // Get the contract factory
  const PackStore = await ethers.getContractFactory("PackStore");

  console.log("Deploying PackStore with proxy...");

  // Deploy the contract behind a proxy
  const packStoreProxy: Contract = await upgrades.deployProxy(PackStore, {
    initializer: false, // No initializer for this contract
    kind: "uups", // UUPS upgradeable proxy pattern
  });

  await packStoreProxy.deployed();

  console.log("PackStore deployed to proxy address:", packStoreProxy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
