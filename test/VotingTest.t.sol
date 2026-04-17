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
        (uint256 id, bytes32 storedContentHash, uint256 storedDeadline, bool isActive) = voting.polls(0);

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

        (uint256 id1,,,) = voting.polls(0);
        (uint256 id2,,,) = voting.polls(1);

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

        vm.expectRevert("Empty list");
        vm.prank(OWNER);
        voting.addToWhitelist(0, new address[](0));
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

    function testVoteSuccess() public {
        // Arrange
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll 1"), block.timestamp + 1 days, 3);

        address voter = makeAddr("Voter");
        address[] memory voters = new address[](1);
        voters[0] = voter;

        vm.prank(OWNER);
        voting.addToWhitelist(0, voters);

        // Act
        vm.prank(voter);
        voting.vote(0, 1);

        // Assert
        assertTrue(voting.hasVoted(0, voter));
        assertEq(voting.voteCounts(0, 1), 1);
    }

    function testVoteRevertIfPollDoesNotExist() public {
        vm.expectRevert("Poll does not exist");
        vm.prank(USER);
        voting.vote(999, 0);
    }

    function testVoteRevertIfPollNotActive() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);
        vm.prank(OWNER);
        voting.endPoll(0);
        vm.expectRevert("Poll is not active");
        vm.prank(USER);
        voting.vote(0, 0);
    }

    function testVoteRevertIfNotWhitelisted() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);
        vm.expectRevert("Not whitelisted to vote");
        vm.prank(USER);
        voting.vote(0, 0);
    }

    function testVoteRevertIfAlreadyVoted() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);

        address voter = makeAddr("Voter");
        address[] memory voters = new address[](1);
        voters[0] = voter;

        vm.prank(OWNER);
        voting.addToWhitelist(0, voters);

        vm.prank(voter);
        voting.vote(0, 0);

        vm.expectRevert("Already voted");
        vm.prank(voter);
        voting.vote(0, 1);
    }

    function testVoteRevertIfInvalidOption() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);

        address voter = makeAddr("Voter");
        address[] memory voters = new address[](1);
        voters[0] = voter;

        vm.prank(OWNER);
        voting.addToWhitelist(0, voters);

        vm.expectRevert("Invalid option");
        vm.prank(voter);
        voting.vote(0, 2); // Invalid option index
    }

    function testVoteRevertIfPollExpired() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);

        address voter = makeAddr("Voter");
        address[] memory voters = new address[](1);
        voters[0] = voter;

        vm.prank(OWNER);
        voting.addToWhitelist(0, voters);

        vm.warp(block.timestamp + 2 days);

        vm.expectRevert("Poll expired");
        vm.prank(voter);
        voting.vote(0, 0);
    }

    function testVoteWithMaxValidOption() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 3);

        address voter = makeAddr("Voter");
        address[] memory voters = new address[](1);
        voters[0] = voter;

        vm.prank(OWNER);
        voting.addToWhitelist(0, voters);

        vm.prank(voter);
        voting.vote(0, 2); // Max valid option index

        assertTrue(voting.hasVoted(0, voter));
        assertEq(voting.voteCounts(0, 2), 1);
    }

    function testVoteStateUnchangedOnRevert() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);

        address voter = makeAddr("Voter");
        address[] memory voters = new address[](1);
        voters[0] = voter;

        vm.prank(OWNER);
        voting.addToWhitelist(0, voters);

        // Attempt to vote with invalid option
        vm.expectRevert("Invalid option");
        vm.prank(voter);
        voting.vote(0, 2); // Invalid option index

        // Assert state unchanged
        assertFalse(voting.hasVoted(0, voter));
        assertEq(voting.voteCounts(0, 0), 0);
        assertEq(voting.voteCounts(0, 1), 0);
    }

    function testVoteMultipleVotes() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);

        address voter1 = makeAddr("Voter1");
        address voter2 = makeAddr("Voter2");
        address[] memory voters = new address[](2);
        voters[0] = voter1;
        voters[1] = voter2;

        vm.prank(OWNER);
        voting.addToWhitelist(0, voters);

        vm.prank(voter1);
        voting.vote(0, 0);

        vm.prank(voter2);
        voting.vote(0, 1);

        assertTrue(voting.hasVoted(0, voter1));
        assertTrue(voting.hasVoted(0, voter2));
        assertEq(voting.voteCounts(0, 0), 1);
        assertEq(voting.voteCounts(0, 1), 1);
    }

    function testVoteMultipleSameOption() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);

        address voter1 = makeAddr("Voter1");
        address voter2 = makeAddr("Voter2");
        address[] memory voters = new address[](2);
        voters[0] = voter1;
        voters[1] = voter2;

        vm.prank(OWNER);
        voting.addToWhitelist(0, voters);

        vm.prank(voter1);
        voting.vote(0, 0);

        vm.prank(voter2);
        voting.vote(0, 0);

        assertTrue(voting.hasVoted(0, voter1));
        assertTrue(voting.hasVoted(0, voter2));
        assertEq(voting.voteCounts(0, 0), 2);
    }

    function testEndPollSuccess() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);

        vm.prank(OWNER);
        voting.endPoll(0);

        (,,, bool isActive) = voting.polls(0);
        assertFalse(isActive);
    }

    function testEndPollRevertIfNotOwner() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);

        vm.expectRevert();
        vm.prank(USER);
        voting.endPoll(0);
    }

    function testEndPollRevertIfPollDoesNotExist() public {
        vm.expectRevert("Poll does not exist");
        vm.prank(OWNER);
        voting.endPoll(999);
    }

    function testEndPollAlreadyEnded() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);

        vm.prank(OWNER);
        voting.endPoll(0);

        vm.expectRevert("Already ended");
        vm.prank(OWNER);
        voting.endPoll(0);
    }

    function testIsWhitelistedTrue() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);

        address voter = makeAddr("Voter");
        address[] memory voters = new address[](1);
        voters[0] = voter;

        vm.prank(OWNER);
        voting.addToWhitelist(0, voters);

        assertTrue(voting.isWhitelisted(0, voter));
    }

    function testIsWhitelistedFalse() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);

        address voter = makeAddr("Voter");

        assertFalse(voting.isWhitelisted(0, voter));
    }

    function testGetVoteCount() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 3);

        address voter1 = makeAddr("Voter1");
        address voter2 = makeAddr("Voter2");
        address[] memory voters = new address[](2);
        voters[0] = voter1;
        voters[1] = voter2;

        vm.prank(OWNER);
        voting.addToWhitelist(0, voters);

        vm.prank(voter1);
        voting.vote(0, 0);

        vm.prank(voter2);
        voting.vote(0, 0);

        assertEq(voting.getVoteCount(0, 0), 2);
    }

    function testGetVoteCountZero() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 3);

        assertEq(voting.getVoteCount(0, 0), 0);
        assertEq(voting.getVoteCount(0, 1), 0);
        assertEq(voting.getVoteCount(0, 2), 0);
    }

    function testGetVoteCountInvalidOption() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);

        vm.expectRevert();
        voting.getVoteCount(0, 2); // Invalid option index
    }

    function testHasUserVoted() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);

        address voter = makeAddr("Voter");
        address[] memory voters = new address[](1);
        voters[0] = voter;

        vm.prank(OWNER);
        voting.addToWhitelist(0, voters);

        assertFalse(voting.hasUserVoted(0, voter));

        vm.prank(voter);
        voting.vote(0, 0);

        assertTrue(voting.hasUserVoted(0, voter));
    }

    function testGetPollSuccess() public {
        vm.prank(OWNER);
        voting.createPoll(keccak256("Poll"), block.timestamp + 1 days, 2);

        (uint256 id, bytes32 contentHash, uint256 deadline, bool isActive) = voting.getPoll(0);

        assertEq(id, 0);
        assertEq(contentHash, keccak256("Poll"));
        assertEq(deadline, block.timestamp + 1 days);
        assertTrue(isActive);
    }

    function testGetPollRevertIfPollDoesNotExist() public {
        vm.expectRevert("Poll does not exist");
        voting.getPoll(999);
    }

    function testGetPollCount() public {
        vm.startPrank(OWNER);
        voting.createPoll(keccak256("Poll 1"), block.timestamp + 1 days, 2);
        voting.createPoll(keccak256("Poll 2"), block.timestamp + 1 days, 3);
        vm.stopPrank();

        assertEq(voting.s_pollCounter(), 2);
    }

    function testGetPollCountZero() public {
        assertEq(voting.s_pollCounter(), 0);
    }
}
