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

    // Modifiers
    modifier pollExists(uint256 _pollId) {
        require(_pollId < s_pollCounter, "Poll does not exist");
        _;
    }

    modifier poolActive(uint256 _pollId) {
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

    // Functions
    function createPoll(bytes32 _contentHash, uint256 _deadline, uint256 _optionCount) external onlyOwner {
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(_optionCount > 1, "At least two options required");

        uint256 pollId = s_pollCounter;
        polls[pollId] = Poll({id: pollId, contentHash: _contentHash, deadline: _deadline, isActive: true});

        optionCount[pollId] = _optionCount;

        s_pollCounter++;
    }

    function addToWhitelist(uint256 _pollId, address[] calldata _voters) external onlyOwner pollExists(_pollId) {
        for (uint256 i = 0; i < _voters.length; i++) {
            whitelist[_pollId][_voters[i]] = true;
        }
    }
}
