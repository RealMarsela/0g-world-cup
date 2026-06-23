// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/WorldCupDraft.sol";
import "../src/WorldCupEscrow.sol";
import "../src/WorldCupAgentId.sol";
import "../src/WorldCupResults.sol";

contract WorldCupFlowTest is Test {
    WorldCupDraft private draft;
    WorldCupEscrow private escrow;
    WorldCupAgentId private agentId;
    WorldCupResults private results;

    address private alice = address(0xA11CE);
    address private bob = address(0xB0B);
    bytes32 private roomId = keccak256("room-1");
    bytes32 private snapshotHash = keccak256("players-v1");
    bytes32 private lineupHash = keccak256("lineups");
    bytes32 private resultHash = keccak256("result");

    function setUp() public {
        draft = new WorldCupDraft();
        escrow = new WorldCupEscrow(250);
        agentId = new WorldCupAgentId();
        results = new WorldCupResults();
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    function testFreeMatchCommitment() public {
        vm.prank(alice);
        draft.commitLineup(roomId, snapshotHash, lineupHash, 0);
        (address player, bytes32 snap, bytes32 lineup, uint256 wager, bool exists) =
            draft.commitments(roomId, alice);
        assertEq(player, alice);
        assertEq(snap, snapshotHash);
        assertEq(lineup, lineupHash);
        assertEq(wager, 0);
        assertTrue(exists);
    }

    function testWagerDepositAndProtocolFeeAccounting() public {
        vm.prank(alice);
        escrow.deposit{value: 1 ether}(roomId);
        vm.prank(bob);
        escrow.deposit{value: 1 ether}(roomId);
        assertTrue(escrow.canStart(roomId, 2));

        uint256 ownerBefore = address(this).balance;
        uint256 winnerBefore = alice.balance;
        escrow.settle(roomId, payable(alice));

        assertEq(alice.balance - winnerBefore, 1.95 ether);
        assertEq(address(this).balance - ownerBefore, 0.05 ether);
        (,, uint256 depositCount, bool settled) = escrow.escrows(roomId);
        assertEq(depositCount, 2);
        assertTrue(settled);
    }

    function testInvalidSettlementRejected() public {
        vm.expectRevert("empty room");
        escrow.settle(roomId, payable(alice));
    }

    function testWagerRequiresTwoUniqueMatchingDepositsBeforeSettlement() public {
        vm.prank(alice);
        escrow.deposit{value: 1 ether}(roomId);
        assertFalse(escrow.canStart(roomId, 2));

        vm.expectRevert("room not ready");
        escrow.settle(roomId, payable(alice));

        vm.prank(alice);
        vm.expectRevert("already deposited");
        escrow.deposit{value: 1 ether}(roomId);

        vm.prank(bob);
        vm.expectRevert("wager mismatch");
        escrow.deposit{value: 2 ether}(roomId);

        vm.prank(bob);
        escrow.deposit{value: 1 ether}(roomId);
        assertTrue(escrow.canStart(roomId, 2));
    }

    function testEscrowRejectsZeroDepositAndNonOwnerSettlement() public {
        vm.prank(alice);
        vm.expectRevert("deposit required");
        escrow.deposit{value: 0}(roomId);

        vm.prank(alice);
        escrow.deposit{value: 1 ether}(roomId);
        vm.prank(bob);
        escrow.deposit{value: 1 ether}(roomId);

        vm.prank(alice);
        vm.expectRevert("not owner");
        escrow.settle(roomId, payable(alice));
    }

    function testResultHashCommitment() public {
        results.commitResult(roomId, snapshotHash, lineupHash, resultHash, "0g://receipt", alice);
        (bytes32 snap, bytes32 lineup, bytes32 result, string memory uri, address winner, bool exists) =
            results.results(roomId);
        assertEq(snap, snapshotHash);
        assertEq(lineup, lineupHash);
        assertEq(result, resultHash);
        assertEq(uri, "0g://receipt");
        assertEq(winner, alice);
        assertTrue(exists);
    }

    function testDuplicateResultRejected() public {
        results.commitResult(roomId, snapshotHash, lineupHash, resultHash, "0g://receipt", alice);
        vm.expectRevert("result exists");
        results.commitResult(roomId, snapshotHash, lineupHash, resultHash, "0g://receipt-2", bob);
    }

    function testResultCommitmentRejectsInvalidInputsAndNonOwner() public {
        vm.expectRevert("room required");
        results.commitResult(bytes32(0), snapshotHash, lineupHash, resultHash, "0g://receipt", alice);
        vm.expectRevert("snapshot required");
        results.commitResult(roomId, bytes32(0), lineupHash, resultHash, "0g://receipt", alice);
        vm.expectRevert("lineup required");
        results.commitResult(roomId, snapshotHash, bytes32(0), resultHash, "0g://receipt", alice);
        vm.expectRevert("result required");
        results.commitResult(roomId, snapshotHash, lineupHash, bytes32(0), "0g://receipt", alice);
        vm.expectRevert("storage required");
        results.commitResult(roomId, snapshotHash, lineupHash, resultHash, "", alice);
        vm.expectRevert("winner required");
        results.commitResult(roomId, snapshotHash, lineupHash, resultHash, "0g://receipt", address(0));

        vm.prank(alice);
        vm.expectRevert("not owner");
        results.commitResult(roomId, snapshotHash, lineupHash, resultHash, "0g://receipt", alice);
    }

    function testAgentBankrollLimits() public {
        vm.prank(alice);
        draft.registerAgent(keccak256("ZeroNine Scout"), 10 ether, 2 ether, 12, 3, 5 ether);
        assertTrue(draft.assertAgentWager(alice, 2 ether));
        vm.expectRevert("agent wager limit");
        draft.assertAgentWager(alice, 3 ether);
        vm.expectRevert("agent missing");
        draft.assertAgentWager(bob, 1 ether);
    }

    function testDraftRejectsInvalidLineupAndAgentConfig() public {
        vm.expectRevert("room required");
        draft.commitLineup(bytes32(0), snapshotHash, lineupHash, 0);
        vm.expectRevert("snapshot required");
        draft.commitLineup(roomId, bytes32(0), lineupHash, 0);
        vm.expectRevert("lineup required");
        draft.commitLineup(roomId, snapshotHash, bytes32(0), 0);

        vm.expectRevert("name required");
        draft.registerAgent(bytes32(0), 10 ether, 2 ether, 12, 3, 5 ether);
        vm.expectRevert("bankroll required");
        draft.registerAgent(keccak256("ZeroNine Scout"), 0, 0, 12, 3, 0);
        vm.expectRevert("wager exceeds bankroll");
        draft.registerAgent(keccak256("ZeroNine Scout"), 1 ether, 2 ether, 12, 3, 0);
        vm.expectRevert("stop loss exceeds bankroll");
        draft.registerAgent(keccak256("ZeroNine Scout"), 1 ether, 1 ether, 12, 3, 2 ether);
    }

    function testAgenticIdMetadataLifecycle() public {
        vm.prank(alice);
        uint256 tokenId = agentId.mintAgent(keccak256("encrypted-agent"), "0g://storage/agent", "ZeroNine Scout");
        (address owner, bytes32 metadataHash, string memory uri, string memory name, address executor, bool exists) =
            agentId.agents(tokenId);
        assertEq(owner, alice);
        assertEq(metadataHash, keccak256("encrypted-agent"));
        assertEq(uri, "0g://storage/agent");
        assertEq(name, "ZeroNine Scout");
        assertEq(executor, address(0));
        assertTrue(exists);

        vm.prank(alice);
        agentId.authorizeUsage(tokenId, bob);
        (,,,, address updatedExecutor,) = agentId.agents(tokenId);
        assertEq(updatedExecutor, bob);

        vm.prank(alice);
        agentId.transferAgent(tokenId, bob, bytes("sealed-key"), bytes("proof"));
        (address newOwner,,,, address resetExecutor,) = agentId.agents(tokenId);
        assertEq(newOwner, bob);
        assertEq(resetExecutor, address(0));
    }

    function testAgenticIdCloneAndInvalidLifecycleInputs() public {
        vm.expectRevert("metadata required");
        agentId.mintAgent(bytes32(0), "0g://storage/agent", "ZeroNine Scout");
        vm.expectRevert("storage required");
        agentId.mintAgent(keccak256("encrypted-agent"), "", "ZeroNine Scout");
        vm.expectRevert("name required");
        agentId.mintAgent(keccak256("encrypted-agent"), "0g://storage/agent", "");

        vm.prank(alice);
        uint256 tokenId = agentId.mintAgent(keccak256("encrypted-agent"), "0g://storage/agent", "ZeroNine Scout");
        vm.prank(alice);
        vm.expectRevert("executor required");
        agentId.authorizeUsage(tokenId, address(0));
        vm.prank(bob);
        vm.expectRevert("not owner");
        agentId.authorizeUsage(tokenId, bob);
        vm.prank(alice);
        vm.expectRevert("receiver required");
        agentId.transferAgent(tokenId, address(0), bytes("sealed-key"), bytes("proof"));
        vm.prank(alice);
        vm.expectRevert("sealed key required");
        agentId.transferAgent(tokenId, bob, bytes(""), bytes("proof"));
        vm.prank(alice);
        vm.expectRevert("proof required");
        agentId.transferAgent(tokenId, bob, bytes("sealed-key"), bytes(""));

        vm.prank(alice);
        uint256 cloneId = agentId.cloneAgent(tokenId, bob, keccak256("clone-encrypted-agent"), "0g://storage/agent-clone");
        (address cloneOwner, bytes32 cloneHash, string memory cloneUri, string memory cloneName,, bool cloneExists) =
            agentId.agents(cloneId);
        assertEq(cloneOwner, bob);
        assertEq(cloneHash, keccak256("clone-encrypted-agent"));
        assertEq(cloneUri, "0g://storage/agent-clone");
        assertEq(cloneName, "ZeroNine Scout");
        assertTrue(cloneExists);
    }

    receive() external payable {}
}
