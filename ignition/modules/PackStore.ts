import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PackStoreModule = buildModule("PackStore", (m) => {
  const packStore = m.contract("PackStore");

  return { packStore };
});

export default PackStoreModule;
