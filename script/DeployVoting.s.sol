// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";
import {Voting} from "../src/Voting.sol";

contract DeployVoting is Script {
    function run() external {
        // Start broadcasting transactions
        vm.startBroadcast();

        address deployer = msg.sender;
        Voting voting = new Voting(deployer);

        vm.stopBroadcast();
    }
}
