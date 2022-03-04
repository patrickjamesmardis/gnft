// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./GNFT.sol";

contract GNFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _ids;
    Counters.Counter private _itemsSold;

    address payable private _owner;

    constructor() {
        _owner = payable(msg.sender);
    }

    function getMarketOwner() public view returns (address) {
        return _owner;
    }

    struct Item {
        uint256 itemId;
        address tokenContract;
        uint256 tokenId;
        address artist;
        address seller;
        address owner;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => Item) private _items;
    mapping(uint256 => uint256) private _unsoldItems;
    mapping(uint256 => uint256) private _itemToUnsoldIndex;
    mapping(uint256 => uint256) private _gnftTokenToItem;

    event ItemCreated(
        uint256 indexed itemId,
        address indexed tokenContract,
        uint256 indexed tokenId,
        address artist,
        address seller,
        address owner,
        uint256 price,
        bool
    );

    function listItem(address tokenContract, uint256 tokenId, uint256 price) public nonReentrant {
        require(price > 0, "Price must be greater than 0.");
        require(IERC721(tokenContract).ownerOf(tokenId) == msg.sender, "You must own the token you are trying to sell.");

        uint256 totalUnsold = _ids.current() - _itemsSold.current();

        _ids.increment();
        uint256 itemId = _ids.current();

        address artist = GNFT(tokenContract).getArtistOf(tokenId);
        _items[itemId] = Item(
            itemId,
            tokenContract,
            tokenId,
            artist,
            msg.sender,
            address(0),
            price,
            false
        );

        _gnftTokenToItem[tokenId] = itemId;
        _itemToUnsoldIndex[tokenId] = totalUnsold;
        _unsoldItems[totalUnsold] = itemId;

        IERC721(tokenContract).transferFrom(msg.sender, address(this), tokenId);

        emit ItemCreated(
            itemId,
            tokenContract,
            tokenId,
            artist,
            msg.sender,
            address(0),
            price,
            false
        );
    }

    function _removeFromUnsold(uint256 itemId) internal {
        uint256 totalUnsold = _ids.current() - _itemsSold.current();
        uint256 unsoldIndex = _itemToUnsoldIndex[itemId];
        uint lastItem = _unsoldItems[totalUnsold];
        _unsoldItems[unsoldIndex] = _unsoldItems[totalUnsold];
        _unsoldItems[totalUnsold] = 0;
        _itemToUnsoldIndex[itemId] = 0;
        _itemToUnsoldIndex[lastItem] = unsoldIndex;
    }

    function purchaseItem(uint256 itemId) public payable nonReentrant {
        require(itemId <= _ids.current(), "You cannot purchase an item that does not exist.");
        require(!_items[itemId].sold, "You cannot purchase an item that is not for sell.");
        
        address seller = _items[itemId].seller;
        uint256 price = _items[itemId].price;

        require(msg.sender != seller, "You cannot purchase your own item.");
        require(msg.value == price, "You must submit the asking price.");        

        uint256 tokenId = _items[itemId].tokenId;
        address tokenContract = _items[itemId].tokenContract;
        address artist = _items[itemId].artist;

        if (seller == artist) {
            payable(seller).transfer((msg.value * 98) / 100);
        } else {
            payable(artist).transfer((msg.value * 20) / 100);
            payable(seller).transfer((msg.value * 78) / 100);
        }

        IERC721(tokenContract).transferFrom(address(this), msg.sender, tokenId);
        _items[itemId].owner = msg.sender;
        _items[itemId].sold = true;
        _itemsSold.increment();
        _removeFromUnsold(itemId);
    }

    function getGNFTItem(uint256 tokenId) public view returns (Item memory) {
        uint256 itemId = _gnftTokenToItem[tokenId];
        if (itemId == 0) {
            return Item(
                0,
                address(0),
                0,
                address(0),
                address(0),
                address(0),
                0,
                false
            );
        } else {
            return _items[itemId];
        }
    }

    function getItems() public view returns (Item[] memory) {
        uint256 itemCount = _ids.current();
        uint256 unsoldItemCount = itemCount - _itemsSold.current();

        Item[] memory items = new Item[](unsoldItemCount);

        uint256 currentIndex = 0;
        uint256 i = 0;
        uint256 j = 0;
        while (i < itemCount && j < unsoldItemCount) {
            if (!_items[i+1].sold) {
                Item storage currentItem = _items[i+1];
                items[currentIndex] = currentItem;
                currentIndex++;
            }
            i++;
            j++;
        }

        return items;
    }

    function getTotalUnsoldItems() public view returns (uint256) {
        return _ids.current() - _itemsSold.current();
    }

    function getUnsoldItemByIndex(uint256 idx) public view returns (uint256) {
        uint256 totalUnsold = _ids.current() - _itemsSold.current();
        require(idx < totalUnsold, "unsold item index out of bounds");
        return _unsoldItems[idx];
    }

    function cancelSell(uint256 itemId) public nonReentrant {
        require(itemId <= _ids.current(), "Cannot cancel the sell of an item that does not exist.");
        require(!_items[itemId].sold, "Cannot cancel the sell of an item that has already sold.");
        address seller = _items[itemId].seller;
        require (msg.sender == seller, "Only the seller can cancel a sell");
        

        uint256 tokenId = _items[itemId].tokenId;
        address tokenContract = _items[itemId].tokenContract;
        IERC721(tokenContract).transferFrom(address(this), msg.sender, tokenId);
        _items[itemId].owner = msg.sender;
        _items[itemId].sold = true;
        _itemsSold.increment();
        _removeFromUnsold(itemId);
    }

    function cashOut() public {
        require(msg.sender == _owner, "Only the owner can cashout the market");
        _owner.transfer(address(this).balance);
    }
}