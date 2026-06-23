// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../contracts/src/WorldCupDraft.sol";
import "../contracts/src/WorldCupEscrow.sol";
import "../contracts/src/WorldCupAgentId.sol";
import "../contracts/src/WorldCupResults.sol";

contract Deploy is Script {
    function run()
        external
        returns (WorldCupDraft draft, WorldCupEscrow escrow, WorldCupResults results, WorldCupAgentId agentId)
    {
        vm.startBroadcast();
        draft = new WorldCupDraft();
        escrow = new WorldCupEscrow(250);
        results = new WorldCupResults();
        agentId = new WorldCupAgentId();
        vm.stopBroadcast();
    }
}
