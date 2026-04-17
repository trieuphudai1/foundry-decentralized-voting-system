// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Voting is Ownable, ReentrancyGuard {
    // Storage
    uint256 public s_pollCounter;

    // Constructor
    constructor(address initialOwner) Ownable(initialOwner) {}

    struct Poll {
        uint256 id;
        bytes32 contentHash;
        uint256 deadline;
        bool isActive;
    }

    // Mapping
    mapping(uint256 => Poll) public polls;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => bool)) public whitelist;
    mapping(uint256 => uint256) public optionCount;
    mapping(uint256 => mapping(uint256 => uint256)) public voteCounts;

    // Modifiers
    modifier pollExists(uint256 _pollId) {
        require(_pollId < s_pollCounter, "Poll does not exist");
        _;
    }

    modifier pollActive(uint256 _pollId) {
        require(polls[_pollId].isActive, "Poll is not active");
        _;
    }

    modifier onlyWhitelisted(uint256 _pollId) {
        require(whitelist[_pollId][msg.sender], "Not whitelisted to vote");
        _;
    }

    modifier notVoted(uint256 _pollId) {
        require(!hasVoted[_pollId][msg.sender], "Already voted");
        _;
    }

    modifier beforeDeadline(uint256 _pollId) {
        require(block.timestamp < polls[_pollId].deadline, "Poll expired");
        _;
    }

    // Functions
    function createPoll(bytes32 _contentHash, uint256 _deadline, uint256 _optionCount) external onlyOwner {
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(_optionCount > 1, "At least two options required");

        uint256 pollId = s_pollCounter;
        polls[pollId] = Poll({id: pollId, contentHash: _contentHash, deadline: _deadline, isActive: true});

        optionCount[pollId] = _optionCount;

        s_pollCounter++;
    }

    function endPoll(uint256 _pollId) external onlyOwner pollExists(_pollId) {
        require(polls[_pollId].isActive, "Already ended");
        polls[_pollId].isActive = false;
    }

    function addToWhitelist(uint256 _pollId, address[] calldata _voters) external onlyOwner pollExists(_pollId) {
        uint256 voterLength = _voters.length;
        for (uint256 i = 0; i < voterLength; i++) {
            whitelist[_pollId][_voters[i]] = true;
        }
    }

    function vote(uint256 _pollId, uint256 _option)
        external
        pollExists(_pollId)
        pollActive(_pollId)
        onlyWhitelisted(_pollId)
        notVoted(_pollId)
        beforeDeadline(_pollId)
        nonReentrant
    {
        require(_option < optionCount[_pollId], "Invalid option");

        hasVoted[_pollId][msg.sender] = true;

        voteCounts[_pollId][_option]++;
    }

    function isWhitelisted(uint256 _pollId, address _voter) external view returns (bool) {
        return whitelist[_pollId][_voter];
    }

    function getVoteCount(uint256 _pollId, uint256 _option) external view returns (uint256) {
        require(_option < optionCount[_pollId], "Invalid option");
        return voteCounts[_pollId][_option];
    }

    function hasUserVoted(uint256 _pollId, address _voter) external view returns (bool) {
        return hasVoted[_pollId][_voter];
    }

    function getPoll(uint256 _pollId) external view returns (Poll memory) {
        require(_pollId < s_pollCounter, "Poll does not exist");
        return polls[_pollId];
    }
}
