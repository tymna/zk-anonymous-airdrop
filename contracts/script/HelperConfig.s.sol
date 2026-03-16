// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Script} from "forge-std/Script.sol";
import {ERC20Mock} from "../test/mock/ERC20Mock.sol";
import {ERC5564AnnouncerMock} from "../test/mock/ERC5564AnnouncerMock.sol";
import {HonkVerifier} from "../src/Verifier.sol";

// UPDATE WITH VALID DATA

contract HelperConfig is Script {
    struct NetworkConfig {
        address token;
        uint256 totalSupply;
        bytes32 merkleRoot;
        address verifier;
        address announcer;
        address relayer;
    }

    NetworkConfig public activeNetworkConfig;
    uint256 constant TOTAL_SUPPLY = 1000000 * 1e18;

    /// @dev Canonical ERC-5564 Announcer (same address on all EVM chains)
    address constant ERC5564_ANNOUNCER = 0x55649E01B5Df198D18D95b5cc5051630cfD45564;

    constructor() {
        if (block.chainid == 11155111) {
            activeNetworkConfig = getSepoliaEthConfig();
        } else {
            activeNetworkConfig = getAnvilConfig();
        }
    }

    function getSepoliaEthConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            token: 0xD89BA48B8855CAbE9E81B48D9c7247C0ea977fB9,
            totalSupply: TOTAL_SUPPLY,
            merkleRoot: 0x01810706b5812d4e8448dee6cee1f051daabed5e078904271caeb92428bee8f7,
            verifier: 0x662530cC219255dc66772B37B8228EE78012aA14,
            announcer: ERC5564_ANNOUNCER,
            relayer: 0x82f31E32512d8E62d1898981e230752D73A08322
        });
    }

    function getAnvilConfig() public returns (NetworkConfig memory) {
        ERC20Mock token = new ERC20Mock();
        HonkVerifier verifier = new HonkVerifier();
        ERC5564AnnouncerMock announcer = new ERC5564AnnouncerMock();

        return NetworkConfig({
            token: address(token),
            totalSupply: TOTAL_SUPPLY,
            merkleRoot: bytes32(uint256(1)),
            verifier: address(verifier),
            announcer: address(announcer),
            relayer: 0x0000000000000000000000000000000000000001
        });
    }
}
