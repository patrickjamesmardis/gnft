// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./GNFT.sol";

contract GNFTMarket is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _ids;
    Counters.Counter private _itemsSold;

    constructor() {}

    struct Item {
        uint256 itemId;
        address tokenContract;
        uint256 tokenId;
        address creator;
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
        address creator,
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

        address creator = GNFT(tokenContract).creatorOf(tokenId);
        _items[itemId] = Item(
            itemId,
            tokenContract,
            tokenId,
            creator,
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
            creator,
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
        address creator = _items[itemId].creator;

        if (seller == creator) {
            payable(seller).transfer((msg.value * 98) / 100);
        } else {
            payable(creator).transfer((msg.value * 20) / 100);
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

    function getTotalUnsoldItems() public view returns (uint256) {
        return _ids.current() - _itemsSold.current();
    }

    function getUnsoldItemByIndex(uint256 idx) public view returns (uint256) {
        uint256 totalUnsold = _ids.current() - _itemsSold.current();
        require(idx < totalUnsold, "unsold item index out of bounds");
        return _unsoldItems[idx];
    }

    function getPaginatedItems(uint256 pageSize, uint256 page) public view returns (Item[] memory) {
        require(pageSize > 0 && pageSize < 101, "page size out of bounds");
        require(page > 0 && (page - 1) * pageSize < getTotalUnsoldItems(), "page out of bounds");

        uint256 startIndex = (page - 1) * pageSize;
        uint256 endIndex = getTotalUnsoldItems() - 1 < startIndex + pageSize - 1 ? getTotalUnsoldItems() - 1 : startIndex + pageSize - 1;
        uint256 actualPageSize = endIndex - startIndex + 1;
        Item[] memory items = new Item[](actualPageSize);

        for(uint256 i = 0; i < actualPageSize; i++) {
            uint256 itemId = getUnsoldItemByIndex(i + (pageSize * (page - 1)));
            items[i] = _items[itemId];
        }

        return items;
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

    function cashOut() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}