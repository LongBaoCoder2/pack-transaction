import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { IgnitionModuleBuilder } from "@nomicfoundation/ignition-core";
import { ethers } from "ethers";

const ProxyModule = buildModule(
  "ProxyModule",
  (builder: IgnitionModuleBuilder) => {
    // This address is the owner of the ProxyAdmin contract,
    // so it will be the only account that can upgrade the proxy when needed.
    const proxyAdminOwner = builder.getAccount(0);
    // Deploy the implementation contract
    const implementation = builder.contract("PackStore");

    // Encode the initialize function call for the contract.
    const initialize = builder.encodeFunctionCall(
      implementation,
      "initialize",
      [proxyAdminOwner]
    );

    // Deploy the ERC1967 Proxy, pointing to the implementation
    const proxy = builder.contract("ERC1967Proxy", [
      implementation,
      initialize,
    ]);

    return { proxy };
  }
);

export const PackStoreModule = buildModule(
  "PackStoreModule",
  (builder: IgnitionModuleBuilder) => {
    // Get the proxy from the previous module.
    const { proxy } = builder.useModule(ProxyModule);

    // Create a contract instance using the deployed proxy's address.
    const instance = builder.contractAt("PackStore", proxy);

    return { instance, proxy };
  }
);

export default PackStoreModule;
