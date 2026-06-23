// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract WorldCupDraft {
    struct LineupCommitment {
        address player;
        bytes32 snapshotHash;
        bytes32 lineupHash;
        uint256 wagerAmount;
        bool exists;
    }

    struct AgentLimits {
        bytes32 displayNameHash;
        uint256 bankroll;
        uint256 maxWagerPerMatch;
        uint256 maxGamesPerDay;
        uint256 maxGamesPerOpponent;
        uint256 stopLoss;
        bool exists;
    }

    mapping(bytes32 => mapping(address => LineupCommitment)) public commitments;
    mapping(address => AgentLimits) public agents;

    event LineupCommitted(
        bytes32 indexed roomId,
        address indexed player,
        bytes32 snapshotHash,
        bytes32 lineupHash,
        uint256 wagerAmount
    );
    event AgentRegistered(address indexed agent, bytes32 displayNameHash, uint256 bankroll);

    function commitLineup(
        bytes32 roomId,
        bytes32 snapshotHash,
        bytes32 lineupHash,
        uint256 wagerAmount
    ) external {
        require(roomId != bytes32(0), "room required");
        require(snapshotHash != bytes32(0), "snapshot required");
        require(lineupHash != bytes32(0), "lineup required");
        commitments[roomId][msg.sender] = LineupCommitment({
            player: msg.sender,
            snapshotHash: snapshotHash,
            lineupHash: lineupHash,
            wagerAmount: wagerAmount,
            exists: true
        });
        emit LineupCommitted(roomId, msg.sender, snapshotHash, lineupHash, wagerAmount);
    }

    function registerAgent(
        bytes32 displayNameHash,
        uint256 bankroll,
        uint256 maxWagerPerMatch,
        uint256 maxGamesPerDay,
        uint256 maxGamesPerOpponent,
        uint256 stopLoss
    ) external {
        require(displayNameHash != bytes32(0), "name required");
        require(bankroll > 0, "bankroll required");
        require(maxWagerPerMatch <= bankroll, "wager exceeds bankroll");
        require(stopLoss <= bankroll, "stop loss exceeds bankroll");
        agents[msg.sender] = AgentLimits({
            displayNameHash: displayNameHash,
            bankroll: bankroll,
            maxWagerPerMatch: maxWagerPerMatch,
            maxGamesPerDay: maxGamesPerDay,
            maxGamesPerOpponent: maxGamesPerOpponent,
            stopLoss: stopLoss,
            exists: true
        });
        emit AgentRegistered(msg.sender, displayNameHash, bankroll);
    }

    function assertAgentWager(address agent, uint256 wagerAmount) external view returns (bool) {
        AgentLimits memory limits = agents[agent];
        require(limits.exists, "agent missing");
        require(wagerAmount <= limits.maxWagerPerMatch, "agent wager limit");
        require(wagerAmount <= limits.bankroll, "agent bankroll limit");
        return true;
    }
}
