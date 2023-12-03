// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract ERC721_token is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    //Registered: On sale, Unregistered: Not on sale
    enum ItemStatus {
        Registered, 
        Unregistered    
    }

    struct skin {
        uint256 tokenPrice;
        ItemStatus _itemstatus;
    }

    mapping(uint256 => skin) public _skin;

    constructor() Ownable() ERC721("Skin", "SKN") {}

    //Mint NFT with URI and its initial price (ERC 721)
    function mintNFT(string memory tokenURI, uint256 price) public returns (uint256){
        require(price > 0, "The price cannot be a negative value.");
        
        uint256 newItemId = _tokenIdCounter;
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        
        _skin[newItemId] = skin({
            _itemstatus: ItemStatus.Unregistered,
            tokenPrice: price
        });

        _tokenIdCounter += 1;

        return newItemId;
    }

    //Change a price for minted NFT
    function changeTokenPrice(uint256 tokenId, uint256 price) public {
        require(msg.sender == ownerOf(tokenId), "You can only access tokens you own");
        require(_skin[tokenId]._itemstatus == ItemStatus.Unregistered, "You must withdraw this item before you change the price");
        require(price > 0, "The price cannot be a negative value.");
        _skin[tokenId].tokenPrice = price;
    }

    //Buy NFT that is Registered(On sale)
    function buyNFTItem(uint256 tokenId) public payable {
        require(ownerOf(tokenId) != msg.sender, "You can't buy your own NFT");
        require(msg.value >= _skin[tokenId].tokenPrice, "Insufficient funds");
        require(_skin[tokenId]._itemstatus == ItemStatus.Registered, "This item is not available");
        address owner = ownerOf(tokenId);
        safeTransferFrom(owner, msg.sender, tokenId);
        payable(owner).transfer(msg.value);
        _skin[tokenId]._itemstatus = ItemStatus.Unregistered;
    }

    function setup(address buyer) public {
        setApprovalForAll(buyer, true);
    }

    //Display a NFT to sell
    function DisplayItem(uint256 tokenId) public {
        require(msg.sender == ownerOf(tokenId), "You can only access tokens you own");
        require(_skin[tokenId]._itemstatus == ItemStatus.Unregistered, "This item is already being displayed");
        _skin[tokenId]._itemstatus = ItemStatus.Registered;
    }

    //Withdraw a NFT to cancel selling
    function UndisplayItem(uint256 tokenId) public {
        require(msg.sender == ownerOf(tokenId), "You can only access tokens you own");
        require(_skin[tokenId]._itemstatus == ItemStatus.Registered, "This item isn't already being displayed");
        _skin[tokenId]._itemstatus = ItemStatus.Unregistered;
    }

    function SearchSkin(uint256 tokenId) public view returns (uint256){
        require(_skin[tokenId]._itemstatus == ItemStatus.Registered, "This item isn't registered on the market");
        return _skin[tokenId].tokenPrice;
    }
}