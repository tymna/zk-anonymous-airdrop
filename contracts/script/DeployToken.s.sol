// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Script, console2} from "forge-std/Script.sol";
import {ERC20Mock} from "../test/mock/ERC20Mock.sol";

contract DeployToken is Script {
    function run() public returns (ERC20Mock) {
        vm.startBroadcast();
        ERC20Mock token = new ERC20Mock();
        vm.stopBroadcast();

        console2.log("ERC20Mock deployed at:", address(token));
        return token;
    }
}
