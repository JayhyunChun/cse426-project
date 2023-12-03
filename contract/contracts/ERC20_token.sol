// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract ERC20_token is ERC20, Ownable {
    struct GItem {
        uint256 itemId;
        string itemName;
        uint256 itemPrice;
    }


    uint256 public idCount;
    mapping(address => uint256) public generalItemsOwned;
    mapping(uint256 => GItem) public GItemMap;


    constructor() Ownable() ERC20("IngameMoney", "Gold") {
        _mint(msg.sender, 1000000 * (10 ** uint256(decimals())));
    }


    function giveGold(address _to) public{
        _mint(_to, 1000000 * (10 ** uint256(decimals())));
    }


    function registerNewItem (string memory _name, uint256 _price) public onlyOwner{
        require(bytes(_name).length > 0, "Please set the name.");
        require(_price > 0, "Price must be bigger than 0.");


        GItem memory newItem = GItem ({
            itemId: idCount,
            itemName: _name,
            itemPrice: _price
        });
        GItemMap[idCount] = newItem;
        idCount++;
    }


    function purchaseGeneralItem(uint256 _id) public {
        require(_id < idCount, "Invalid ID");
        uint256 totalPrice = GItemMap[_id].itemPrice * (10 ** uint256(decimals())) * 1;
        require(balanceOf(msg.sender) >= totalPrice, "Not enough Gold");
       
        _transfer(msg.sender, address(this), totalPrice);
        generalItemsOwned[msg.sender] += 1;
    }


    function displayItems(uint256 _id) public view returns (GItem memory) {
        require(_id < idCount, "Can't find the item of the ID");
        return GItemMap[_id];
    }

    function searchItemPrice(uint256 _id) public view returns (uint256) {
        require(_id < idCount, "Can't find the item of the ID");
        return GItemMap[_id].itemPrice;
    }
}
