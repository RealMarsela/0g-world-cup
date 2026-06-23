// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract WorldCupResults {
    struct ResultReceipt {
        bytes32 snapshotHash;
        bytes32 lineupHash;
        bytes32 resultHash;
        string storageUri;
        address winner;
        bool exists;
    }

    address public owner;
    mapping(bytes32 => ResultReceipt) public results;

    event ResultCommitted(
        bytes32 indexed roomId,
        bytes32 snapshotHash,
        bytes32 lineupHash,
        bytes32 resultHash,
        string storageUri,
        address indexed winner
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function commitResult(
        bytes32 roomId,
        bytes32 snapshotHash,
        bytes32 lineupHash,
        bytes32 resultHash,
        string calldata storageUri,
        address winner
    ) external onlyOwner {
        require(roomId != bytes32(0), "room required");
        require(snapshotHash != bytes32(0), "snapshot required");
        require(lineupHash != bytes32(0), "lineup required");
        require(resultHash != bytes32(0), "result required");
        require(bytes(storageUri).length > 0, "storage required");
        require(winner != address(0), "winner required");
        require(!results[roomId].exists, "result exists");
        results[roomId] = ResultReceipt({
            snapshotHash: snapshotHash,
            lineupHash: lineupHash,
            resultHash: resultHash,
            storageUri: storageUri,
            winner: winner,
            exists: true
        });
        emit ResultCommitted(roomId, snapshotHash, lineupHash, resultHash, storageUri, winner);
    }
}
