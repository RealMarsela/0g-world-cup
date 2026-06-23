// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract WorldCupEscrow {
    struct RoomEscrow {
        uint256 totalDeposited;
        uint256 wagerAmount;
        uint256 depositCount;
        bool settled;
    }

    address public owner;
    uint16 public protocolFeeBps;
    mapping(bytes32 => RoomEscrow) public escrows;
    mapping(bytes32 => mapping(address => bool)) public hasDeposited;

    event Deposited(bytes32 indexed roomId, address indexed player, uint256 amount);
    event Settled(bytes32 indexed roomId, address indexed winner, uint256 payout, uint256 fee);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(uint16 feeBps) {
        require(feeBps <= 1_000, "fee too high");
        owner = msg.sender;
        protocolFeeBps = feeBps;
    }

    function deposit(bytes32 roomId) external payable {
        require(roomId != bytes32(0), "room required");
        require(msg.value > 0, "deposit required");
        require(!escrows[roomId].settled, "settled");
        require(!hasDeposited[roomId][msg.sender], "already deposited");
        RoomEscrow storage room = escrows[roomId];
        if (room.wagerAmount == 0) {
            room.wagerAmount = msg.value;
        } else {
            require(msg.value == room.wagerAmount, "wager mismatch");
        }
        room.totalDeposited += msg.value;
        room.depositCount += 1;
        hasDeposited[roomId][msg.sender] = true;
        emit Deposited(roomId, msg.sender, msg.value);
    }

    function settle(bytes32 roomId, address payable winner) external onlyOwner {
        require(winner != address(0), "winner required");
        RoomEscrow storage room = escrows[roomId];
        require(!room.settled, "settled");
        require(room.totalDeposited > 0, "empty room");
        require(room.depositCount >= 2, "room not ready");
        room.settled = true;
        uint256 fee = (room.totalDeposited * protocolFeeBps) / 10_000;
        uint256 payout = room.totalDeposited - fee;
        (bool okWinner,) = winner.call{value: payout}("");
        require(okWinner, "winner transfer failed");
        if (fee > 0) {
            (bool okOwner,) = payable(owner).call{value: fee}("");
            require(okOwner, "fee transfer failed");
        }
        emit Settled(roomId, winner, payout, fee);
    }

    function canStart(bytes32 roomId, uint256 minDeposits) external view returns (bool) {
        RoomEscrow memory room = escrows[roomId];
        return !room.settled && room.depositCount >= minDeposits && room.wagerAmount > 0;
    }
}
