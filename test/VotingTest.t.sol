// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Voting} from "../src/Voting.sol";
import {Test} from "forge-std/Test.sol";

contract VotingTest is Test {
    Voting public voting;
    address OWNER = makeAddr("OWNER");
    address USER = makeAddr("USER");

    function setUp() external {
        voting = new Voting(OWNER);
    }

    function testCreatePollSuccess() public {
        // Arrange
        bytes32 contentHash = keccak256(abi.encodePacked("Poll 1"));
        uint256 deadline = block.timestamp + 1 days;
        uint256 optionCount = 3;

        // Act
        vm.prank(OWNER);
        voting.createPoll(contentHash, deadline, optionCount);

        // Assert
        assertEq(voting.s_pollCounter(), 1);
        (
            uint256 id,
            bytes32 storedContentHash,
            uint256 storedDeadline,
            bool isActive
        ) = voting.polls(0);

        assertEq(id, 0);
        assertEq(storedContentHash, contentHash);
        assertEq(storedDeadline, deadline);
        assertTrue(isActive);
        assertEq(voting.optionCount(0), optionCount);
    }

    function testCreatePollRevertIfDeadlineNotFuture() public {
        // Arrange
        bytes32 contentHash = keccak256(abi.encodePacked("Poll 1"));
        uint256 deadline = block.timestamp;
        uint256 optionCount = 3;

        // Act & Assert
        vm.prank(OWNER);
        vm.expectRevert("Deadline must be in the future");
        voting.createPoll(contentHash, deadline, optionCount);
    }

    function testCreatePollRevertIfOptionCountLessThanTwo() public {
        // Arrange
        bytes32 contentHash = keccak256(abi.encodePacked("Poll 1"));
        uint256 deadline = block.timestamp + 1 days;
        uint256 optionCount = 1;

        // Act & Assert
        vm.prank(OWNER);
        vm.expectRevert("At least two options required");
        voting.createPoll(contentHash, deadline, optionCount);
    }

    function testCreatePollRevertIfNotOwner() public {
        // Arrange
        bytes32 contentHash = keccak256(abi.encodePacked("Poll 1"));
        uint256 deadline = block.timestamp + 1 days;
        uint256 optionCount = 3;

        // Act & Assert
        vm.prank(USER);
        vm.expectRevert();
        voting.createPoll(contentHash, deadline, optionCount);
    }

    function testCreateMultiplePolls() public {
        vm.startPrank(OWNER);

        voting.createPoll(keccak256("Poll 1"), block.timestamp + 1 days, 3);
        voting.createPoll(keccak256("Poll 2"), block.timestamp + 2 days, 4);

        vm.stopPrank();

        assertEq(voting.s_pollCounter(), 2);

        (uint256 id1, , , ) = voting.polls(0);
        (uint256 id2, , , ) = voting.polls(1);

        assertEq(id1, 0);
        assertEq(id2, 1);
    }

    function testAddToWhitelistSuccess() public {
        // Arrange 
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll 1"), block.timestamp + 1 days, 3);

        address[] memory voters = new address[](3);
        voters[0] = makeAddr("Voter1");
        voters[1] = makeAddr("Voter2");
        voters[2] = makeAddr("Voter3");

        // Act
        vm.prank(OWNER);
        voting.addToWhitelist(0, voters);

        // Assert
        for (uint256 i = 0; i < voters.length; i++) {
            assertTrue(voting.whitelist(0, voters[i]));
        }
    }

    function testAddToWhitelistRevertIfNotOwner() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);

        vm.expectRevert();
        vm.prank(USER);
        voting.addToWhitelist(0, new address[](0));
    }

    function testAddToWhitelistRevertIfPollDoesNotExist() public {
        vm.expectRevert("Poll does not exist");
        vm.prank(OWNER);
        voting.addToWhitelist(999, new address[](0));
    }

    function testAddToWhitelistEmptyVoterList() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);

        // Act
        vm.prank(OWNER);
        voting.addToWhitelist(0, new address[](0));

        // Assert - No reverts and whitelist remains unchanged
        assertFalse(voting.whitelist(0, makeAddr("Voter1")));
    }

    function testAddToWhitelistDuplicateVoters() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);

        address[] memory voters = new address[](3);
        voters[0] = makeAddr("Voter1");
        voters[1] = makeAddr("Voter1"); // Duplicate
        voters[2] = makeAddr("Voter2");

        // Act
        vm.prank(OWNER);
        voting.addToWhitelist(0, voters);

        // Assert - Both unique addresses should be whitelisted
        assertTrue(voting.whitelist(0, makeAddr("Voter1")));
        assertTrue(voting.whitelist(0, makeAddr("Voter2")));
    }

    function testAddToWhitelistOverwrite() public {
    vm.prank(OWNER);
    voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);

    address voter = makeAddr("Voter");

    address[] memory voters = new address[](1);
    voters[0] = voter;

    vm.prank(OWNER);
    voting.addToWhitelist(0, voters);

    // add again
    vm.prank(OWNER);
    voting.addToWhitelist(0, voters);

    assertTrue(voting.whitelist(0, voter)); 
    }

    function testWhitelistIsolationBetweenPolls() public {
        vm.startPrank(OWNER);
        voting.createPoll(keccak256("Poll 1"), block.timestamp + 1 days, 2);
        voting.createPoll(keccak256("Poll 2"), block.timestamp + 1 days, 2);
        vm.stopPrank();

        address voter = makeAddr("Voter");
        address[] memory voters = new address[](1);
        voters[0] = voter;

        vm.prank(OWNER);
        voting.addToWhitelist(0, voters);

        assertTrue(voting.whitelist(0, voter));
        assertFalse(voting.whitelist(1, voter));
    }
}
