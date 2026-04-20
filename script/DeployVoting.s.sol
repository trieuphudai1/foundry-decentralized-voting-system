// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";
import {Voting} from "../src/Voting.sol";

contract DeployVoting is Script {
    function run() external {
        // Start broadcasting transactions
        vm.startBroadcast();

        // Deploy the Voting contract with the deployer as the initial owner
        address deployer = msg.sender;
        Voting voting = new Voting(deployer);

        // Stop broadcasting transactions
        vm.stopBroadcast();
    }
}
