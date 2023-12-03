// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ERC20_token.sol";
import "./ERC721_token.sol";

contract ERC1155_token is ERC1155, Ownable{
    uint256 private _tokenIdCounter;

    event CharacterRegistered(uint256 indexed tokenId);
    event SkinRegistered(uint256 indexed tokenId);

    ERC20_token private IECOToken;
    ERC721_token private skinToken;

    address public GameMaster;

    //If Character is on sale or not
    enum CharacterStatus {
        OnSale,
        NotOnSale  
    }

    struct char {
        CharacterStatus _characterStatus;
        uint256 price;
        uint256[] SkinList;
        address characterOwner;
    }

    mapping(uint256 => char) public _characters;

    //check if Character is owned by the sender
    modifier OnlyOwnerOfCharacter(uint256 CharacterId)
    {require(balanceOf(msg.sender, CharacterId) == 1, "You can only access characters you own");
        _;
    }
   
    //check if the character owns the skin
    modifier CharacterOwnSkinNFT(uint256 CharacterId, uint256 SkinTokenId)
    {require(isElementInArray(_characters[CharacterId].SkinList, SkinTokenId), "The character must own the skin");
        _;
    }

    constructor(address _IECO, address _SkinNFT) Ownable() ERC1155("Character") {
        skinToken = ERC721_token(_SkinNFT);
        IECOToken = ERC20_token(_IECO);
        GameMaster = msg.sender;
    }

    //mint in-game gold(ERC 20) to a user
    function GiveGold_to_User(address _to) public {
       IECOToken.giveGold(_to);
    }

    //register new in-game item
    function RegisterItem(string memory _name, uint256 _price) public {
        IECOToken.registerNewItem(_name, _price);
    }

    //to purchase in-game item
    function PurchaseItem(uint256 _id) public {
        IECOToken.purchaseGeneralItem(_id);
    }

    //display in-game item information
    function displayItems(uint256 _id) public view returns (uint256, string memory, uint256) {
        ERC20_token.GItem memory gitem = IECOToken.displayItems(_id);
        return (gitem.itemId, gitem.itemName, gitem.itemPrice);
    }

    //mint a new character (ERC 1155)
    function registerCharacter() public returns (uint256){
        uint256 tokenId = _tokenIdCounter;
        _mint(msg.sender, tokenId, 1, "");
        
        //_characterStatus[tokenId] = CharacterStatus.NotOnSale;
        //characterPrice[tokenId] = 0;
        //characterSkinList[tokenId] = new uint[](0);
        //characterOwner[tokenId] = msg.sender;

        _characters[tokenId] = char({
            _characterStatus: CharacterStatus.NotOnSale,
            price: 0,
            SkinList: new uint256[](0),
            characterOwner: msg.sender
        });

        _tokenIdCounter += 1;

        emit CharacterRegistered(tokenId);
        return tokenId;
    }

    //Only the gamemaster can unregister a character
    function unregisterCharacter(address owner, uint256 CharacterId) public onlyOwner{
        _burn(owner, CharacterId, 1);
    }

    //search skin price
    function searchSkinPrice(uint256 SkinId) public view returns (uint256){
        return skinToken.SearchSkin(SkinId);
    } 

    //buy a skin NFT and assign ownership to the character
    function buyCharacterSkinNFT(uint256 CharacterId, uint256 SkinTokenId) public OnlyOwnerOfCharacter(CharacterId){
        skinToken.buyNFTItem(SkinTokenId);
        _characters[CharacterId].SkinList.push(SkinTokenId);
    }

    function buyNFT(uint256 SkinTokenId) public{
        skinToken.buyNFTItem(SkinTokenId);
    }

    //remove an element from the list
    function removeElement(uint256[] storage myArray, uint256 element) internal {
        for (uint i = 0; i < myArray.length; i++) {
            if (myArray[i] == element) {
                if (i < myArray.length - 1) {
                    myArray[i] = myArray[myArray.length - 1];
                }
                myArray.pop();
                return;
            }
        }
    }

    //check if an element is in the list
    function isElementInArray(uint256[] storage myArray, uint256 element) internal view returns (bool) {
        for (uint i = 0; i < myArray.length; i++) {
            if (myArray[i] == element) {
                return true;
            }
        }
        return false;
    }

    //Display a NFT to sell only if the character is owned by the sender and the character owns the NFT
    function DisplaySkinNFTForSale(uint256 CharacterId, uint256 SkinTokenId) public OnlyOwnerOfCharacter(CharacterId) CharacterOwnSkinNFT(CharacterId, SkinTokenId){
        skinToken.DisplayItem(SkinTokenId);
        removeElement(_characters[CharacterId].SkinList, SkinTokenId);
    }
   
    //Withdraw a NFT to cancel selling only if the character is owned by the sender and the character owns the NFT
    function UndisplaySkinNFTForSale(uint256 CharacterId, uint256 SkinTokenId) public OnlyOwnerOfCharacter(CharacterId) CharacterOwnSkinNFT(CharacterId, SkinTokenId){
        skinToken.UndisplayItem(SkinTokenId);
        _characters[CharacterId].SkinList.push(SkinTokenId);
    }

    //Change a price for the NFT
    function changeNFTPrice(uint256 SkinTokenId, uint256 price) public{
        skinToken.changeTokenPrice(SkinTokenId, price);
    }

    //Mint a new NFT that is owned by the character
    function mintSkinNFT(uint256 CharacterId, string memory tokenURI, uint256 price) public returns (uint256){
        uint256 SkinTokenId = skinToken.mintNFT(tokenURI, price);
        _characters[CharacterId].SkinList.push(SkinTokenId);
        return SkinTokenId;
    }

    //Search a character price
    function searchCharacter(uint256 CharacterId) public view returns (uint256){
        require(_characters[CharacterId]._characterStatus == CharacterStatus.OnSale, "The character is not on sale");
        return _characters[CharacterId].price;
    }

    //Buy a character with all skins that the character owns
    function buyCharacter(uint256 CharacterId) public payable {
        require(_characters[CharacterId]._characterStatus == CharacterStatus.OnSale, "The character is not on sale");
        require(balanceOf(msg.sender, CharacterId) == 0, "You can't buy your own Charcter");
        require(msg.value >= _characters[CharacterId].price, "Insufficient funds");
        address owner = _characters[CharacterId].characterOwner;
        safeTransferFrom(owner, msg.sender, CharacterId, 1, "");
        payable(owner).transfer(msg.value);
        _characters[CharacterId].characterOwner = msg.sender;
        _characters[CharacterId]._characterStatus = CharacterStatus.NotOnSale;
        for (uint i = 0; i < _characters[CharacterId].SkinList.length; i++) {
            skinToken.safeTransferFrom(owner, msg.sender, _characters[CharacterId].SkinList[i]);
        }
    }

    function set(address buyer) public {
        setApprovalForAll(buyer, true);
    }

    function setup(address buyer) public {
        skinToken.setup(buyer);
    }

    //Change the price for the character
    function changeCharacterPrice(uint256 CharacterId, uint256 price) public OnlyOwnerOfCharacter(CharacterId){
        require(_characters[CharacterId]._characterStatus == CharacterStatus.NotOnSale, "You must withdraw this item before you change the price");
        require(price > 0, "The price cannot be a negative value.");
        _characters[CharacterId].price = price;
    }

    //Display the character to sell only if the sender owns
    function DisplayCharacterForSale(uint256 CharacterId) public OnlyOwnerOfCharacter(CharacterId){
        require(_characters[CharacterId]._characterStatus != CharacterStatus.OnSale, "This character is already on sale");
        require(_characters[CharacterId].price > 0, "You haven't set a price for the character");
        _characters[CharacterId]._characterStatus = CharacterStatus.OnSale;
    }

    //Withdraw the character to cancel selling
    function UndisplayCharacter(uint256 CharacterId) public OnlyOwnerOfCharacter(CharacterId){
        require(_characters[CharacterId]._characterStatus != CharacterStatus.NotOnSale, "This character isn't on sale");
        _characters[CharacterId]._characterStatus = CharacterStatus.NotOnSale;
    }

    //Transfer NFT between characters owned by the sender.
    function TransferNFTBetweenCharacters(uint256 From, uint256 To, uint256 NFT) public
    OnlyOwnerOfCharacter(From) OnlyOwnerOfCharacter(To) CharacterOwnSkinNFT(From, NFT){
        _characters[To].SkinList.push(NFT);
        removeElement(_characters[From].SkinList, NFT);
    }

    //Show all skins that the character owns
    function ShowAllSkinsOwnedByCharacter(uint256 CharacterId) public view returns (uint256[] memory) {
        return _characters[CharacterId].SkinList;
    }

    function mintNFT(string memory tokenURI, uint256 price) public returns (uint256){
        uint256 tokenId = skinToken.mintNFT(tokenURI, price);
        emit SkinRegistered(tokenId);
        return tokenId;
    }

    function buyNFTItem(uint256 tokenId) public payable {
        skinToken.buyNFTItem(tokenId);
    }

    function changeTokenPrice(uint256 tokenId, uint256 price) public {
        skinToken.changeTokenPrice(tokenId, price);
    }

    function DisplayItem(uint256 tokenId) public {
        skinToken.DisplayItem(tokenId);
    }

    function UndisplayItem(uint256 tokenId) public {
        skinToken.UndisplayItem(tokenId);
    }

    //check GameMaster
    function IsGameMaster() public view returns (bool) {
        if (msg.sender == GameMaster){
            return true;
        } else {
            return false;
        }
    }
}