// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";


contract RegeneMerkleA is ERC721A, ERC2981 , Ownable, Pausable {
    using Strings for uint256;

    string private baseURI = "";

    uint256 public mintCost = 0.002 ether;
    uint256 public mint_max = 1000;
    bool public mintable = true;
    address public royaltyAddress;
    uint96 public royaltyFee = 500;

//    uint256 constant public MAX_SUPPLY = 9999;
    string constant private BASE_EXTENSION = ".json";
    address constant private BULK_TRANSFER_ADDRESS = 0x27eD0dB22AC700548c3A654cA59c05d2c9A72583;
    address constant private DEFAULT_ROYALITY_ADDRESS = 0x27eD0dB22AC700548c3A654cA59c05d2c9A72583;
    bytes32 public merkleRoot;
    mapping(address => uint256) private whiteListClaimed;


    constructor(
        string memory _name,
        string memory _symbol
    ) ERC721A(_name, _symbol) {
        _setDefaultRoyalty(DEFAULT_ROYALITY_ADDRESS, royaltyFee);
    }


    modifier whenMintable() {
        require(mintable == true, "Mintable: paused");
        _;
    }

    /**
     * @dev The modifier allowing the function access only for real humans.
     */
    modifier callerIsUser() {
        require(tx.origin == msg.sender, "The caller is another contract");
        _;
    }

    // internal
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        return string(abi.encodePacked(ERC721A.tokenURI(tokenId), BASE_EXTENSION));
    }

    /**
     * @notice Set the merkle root for the allow list mint
     */
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function Mint(address _address , bytes32[] calldata _merkleProof)
        public
        payable
        whenMintable
        whenNotPaused
    {
	    uint256 amount = 1;
        uint256 cost = mintCost;
        mintCheck(amount,  cost);
        bytes32 leaf = keccak256(abi.encodePacked(_address));
        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf),
            "Invalid Merkle Proof"
        );

        _mint(msg.sender, amount);
    }

    function mintCheck(
        uint256 _mintAmount,
        uint256 cost
    ) private view {
        require(_mintAmount > 0, "Mint amount cannot be zero");
        require(msg.value >= cost, "Not enough funds");
    }

    function ownerMint(address _address, uint256 count) public onlyOwner {
       _mint(_address, count);
    }

    function setMintCost(uint256 _mintCost) public onlyOwner {
        mintCost = _mintCost;
    }

    function setMintable(bool _state) public onlyOwner {
        mintable = _state;
    }

    function setMintMax(uint256 _max) public onlyOwner {
        mint_max = _max;
    }

    function getSalePrice() public view returns (uint256) {
	return mintCost;
    }

    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function withdraw() external onlyOwner {
        Address.sendValue(payable(owner()), address(this).balance);
    }

    /**
     * @notice Change the royalty fee for the collection
     */
    function setRoyaltyFee(uint96 _feeNumerator) external onlyOwner {
        royaltyFee = _feeNumerator;
        _setDefaultRoyalty(royaltyAddress, royaltyFee);
    }

    /**
     * @notice Change the royalty address where royalty payouts are sent
     */
    function setRoyaltyAddress(address _royaltyAddress) external onlyOwner {
        royaltyAddress = _royaltyAddress;
        _setDefaultRoyalty(royaltyAddress, royaltyFee);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721A, ERC2981) returns (bool) {
        // Supports the following `interfaceId`s:
        // - IERC165: 0x01ffc9a7
        // - IERC721: 0x80ac58cd
        // - IERC721Metadata: 0x5b5e139f
        // - IERC2981: 0x2a55205a
        return
            ERC721A.supportsInterface(interfaceId) ||
            ERC2981.supportsInterface(interfaceId);
    }

}