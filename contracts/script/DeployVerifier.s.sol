// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Script, console2} from "forge-std/Script.sol";
import {HonkVerifier} from "../src/Verifier.sol";

contract DeployVerifier is Script {
    function run() public returns (HonkVerifier) {
        vm.startBroadcast();
        HonkVerifier verifier = new HonkVerifier();
        vm.stopBroadcast();

        console2.log("HonkVerifier deployed at:", address(verifier));
        return verifier;
    }
}
