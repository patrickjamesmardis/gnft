// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./GNFTArtistEnumerable.sol";

contract GNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, GNFTArtistEnumerable {
    using Counters for Counters.Counter;
    Counters.Counter private _ids;

    constructor() ERC721("G-NFT", "GNFT") {}

    function mintToken(string memory _tokenURI) public returns (uint256) {
        _ids.increment();
        uint256 newId = _ids.current();
        _safeMint(msg.sender, newId);
        _setTokenURI(newId, _tokenURI);
        _setCreatorOf(newId, msg.sender);
        return newId;
    }

    struct TokenData {
        uint256 id;
        string tokenURI;
        address owner;
        address creator;
    }

    function tokensOfCreatorByPage(address creator, uint256 pageSize, uint256 page) public view returns (TokenData[] memory) {
        uint256 startIndex = (page - 1) * pageSize;
        require(pageSize > 0 && pageSize < 101, "page size out of bounds");
        require(page > 0 && startIndex < createdBalanceOf(creator), "page out of bounds");
        
        uint256 endIndex = createdBalanceOf(creator) - 1 < startIndex + pageSize - 1 ? createdBalanceOf(creator) - 1 : startIndex + pageSize - 1;
        uint256 actualPageSize = endIndex - startIndex + 1;
        TokenData[] memory tokens = new TokenData[](actualPageSize);

        for (uint256 i = 0; i < actualPageSize; i++) {
            uint256 tokenId = tokenOfCreatorByIndex(creator, (i + (pageSize * (page - 1))));
            tokens[i] = TokenData(tokenId, tokenURI(tokenId), ownerOf(tokenId), creator);
        }

        return tokens;
    }

    function tokensOfOwnerByPage(address owner, uint256 pageSize, uint256 page) public view returns (TokenData[] memory) {
        require(pageSize > 0 && pageSize < 101, "page size out of bounds");
        require(page > 0 && (page - 1) * pageSize < balanceOf(owner), "page out of bounds");

        uint256 startIndex = (page - 1) * pageSize;
        uint256 endIndex = balanceOf(owner) - 1 < startIndex + pageSize - 1 ? balanceOf(owner) - 1 : startIndex + pageSize - 1;
        uint256 actualPageSize = endIndex - startIndex + 1;

        TokenData[] memory tokens = new TokenData[](actualPageSize);

        for (uint256 i = 0; i < actualPageSize; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, (i + (pageSize * (page - 1))));
            tokens[i] = TokenData(tokenId, tokenURI(tokenId), owner, creatorOf(tokenId));
        }

        return tokens;
    }

    function tokenURI(uint256 id) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(id);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 id) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, id);
    }

    function _burn(uint256 id) internal override(ERC721, ERC721URIStorage) {
        super._burn(id);
    }
}
