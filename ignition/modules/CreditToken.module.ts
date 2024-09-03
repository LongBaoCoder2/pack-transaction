import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { IgnitionModuleBuilder } from "@nomicfoundation/ignition-core";
import { ethers } from "ethers";

const ProxyModule = buildModule(
  "ProxyModule",
  (builder: IgnitionModuleBuilder) => {
    // Deploy the implementation contract
    const implementation = builder.contract("CreditToken");

    // Encode the initialize function call for the contract.
    const initialize = builder.encodeFunctionCall(
      implementation,
      "initialize",
      [ethers.parseUnits("100000", 18)]
    );

    // Deploy the ERC1967 Proxy, pointing to the implementation
    const proxy = builder.contract("ERC1967Proxy", [
      implementation,
      initialize,
    ]);

    return { proxy };
  }
);

export const CreditTokenModule = buildModule(
  "CreditTokenModule",
  (builder: IgnitionModuleBuilder) => {
    // Get the proxy from the previous module.
    const { proxy } = builder.useModule(ProxyModule);

    // Create a contract instance using the deployed proxy's address.
    const instance = builder.contractAt("CreditToken", proxy);

    return { instance, proxy };
  }
);

export default CreditTokenModule;
