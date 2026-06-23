// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract WorldCupAgentId {
    struct AgentMetadata {
        address owner;
        bytes32 encryptedMetadataHash;
        string storageUri;
        string displayName;
        address authorizedExecutor;
        bool exists;
    }

    uint256 public nextTokenId = 1;
    mapping(uint256 => AgentMetadata) public agents;

    event AgentMinted(uint256 indexed tokenId, address indexed owner, bytes32 encryptedMetadataHash, string storageUri);
    event AgentUsageAuthorized(uint256 indexed tokenId, address indexed executor);
    event AgentTransferred(uint256 indexed tokenId, address indexed from, address indexed to, bytes sealedKey, bytes proof);

    modifier onlyOwner(uint256 tokenId) {
        require(agents[tokenId].owner == msg.sender, "not owner");
        _;
    }

    function mintAgent(bytes32 encryptedMetadataHash, string calldata storageUri, string calldata displayName)
        external
        returns (uint256 tokenId)
    {
        require(encryptedMetadataHash != bytes32(0), "metadata required");
        require(bytes(storageUri).length > 0, "storage required");
        require(bytes(displayName).length > 0, "name required");
        tokenId = nextTokenId++;
        agents[tokenId] = AgentMetadata({
            owner: msg.sender,
            encryptedMetadataHash: encryptedMetadataHash,
            storageUri: storageUri,
            displayName: displayName,
            authorizedExecutor: address(0),
            exists: true
        });
        emit AgentMinted(tokenId, msg.sender, encryptedMetadataHash, storageUri);
    }

    function authorizeUsage(uint256 tokenId, address executor) external onlyOwner(tokenId) {
        require(executor != address(0), "executor required");
        agents[tokenId].authorizedExecutor = executor;
        emit AgentUsageAuthorized(tokenId, executor);
    }

    function transferAgent(uint256 tokenId, address to, bytes calldata sealedKey, bytes calldata proof)
        external
        onlyOwner(tokenId)
    {
        require(to != address(0), "receiver required");
        require(sealedKey.length > 0, "sealed key required");
        require(proof.length > 0, "proof required");
        address from = msg.sender;
        agents[tokenId].owner = to;
        agents[tokenId].authorizedExecutor = address(0);
        emit AgentTransferred(tokenId, from, to, sealedKey, proof);
    }

    function cloneAgent(uint256 tokenId, address to, bytes32 encryptedMetadataHash, string calldata storageUri)
        external
        onlyOwner(tokenId)
        returns (uint256 newTokenId)
    {
        require(to != address(0), "receiver required");
        require(encryptedMetadataHash != bytes32(0), "metadata required");
        require(bytes(storageUri).length > 0, "storage required");
        newTokenId = nextTokenId++;
        agents[newTokenId] = AgentMetadata({
            owner: to,
            encryptedMetadataHash: encryptedMetadataHash,
            storageUri: storageUri,
            displayName: agents[tokenId].displayName,
            authorizedExecutor: address(0),
            exists: true
        });
        emit AgentMinted(newTokenId, to, encryptedMetadataHash, storageUri);
    }
}
