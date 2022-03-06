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

    function contractURI() public pure returns (string memory) {
        return "https://ipfs.infura.io/ipfs/QmY4aaVmPoAGSFL2WDSJ8X94CWhQeUrqeXUWy41HSno8sb";
    }

    event PermanentURI(string _value, uint256 indexed _id);

    function mintToken(string memory _tokenURI) public returns (uint256) {
        _ids.increment();
        uint256 newId = _ids.current();
        _safeMint(msg.sender, newId);
        _setTokenURI(newId, _tokenURI);
        _setCreatorOf(newId, msg.sender);
        emit PermanentURI(_tokenURI, newId);
        return newId;
    }

    struct TokenData {
        uint256 id;
        string tokenURI;
        address owner;
    }

    function tokensOfCreatorByPage(address creator, uint256 pageSize, uint256 page) public view returns (TokenData[] memory) {
        require(pageSize > 0 && pageSize < 101, "page size out of bounds");
        require(page > 0 && (page - 1) * pageSize < createdBalanceOf(creator), "page out of bounds");
        
        uint256 startIndex = (page - 1) * pageSize;
        uint256 endIndex = createdBalanceOf(creator) - 1 < startIndex + pageSize - 1 ? createdBalanceOf(creator) - 1 : startIndex + pageSize - 1;
        uint256 actualPageSize = endIndex - startIndex + 1;
        TokenData[] memory tokens = new TokenData[](actualPageSize);

        for (uint256 i = 0; i < actualPageSize; i++) {
            uint256 tokenId = tokenOfCreatorByIndex(creator, (i + (pageSize * (page - 1))));
            tokens[i] = TokenData(tokenId, tokenURI(tokenId), ownerOf(tokenId));
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
            tokens[i] = TokenData(tokenId, tokenURI(tokenId), owner);
        }

        return tokens;
    }

    function _beforeTokenTransfer(address from, address to, uint256 id) internal override(ERC721, ERC721Enumerable) {
        if (to == address(0)) {
            _removeFromCreatedEnumeration(from, id);
        }
        super._beforeTokenTransfer(from, to, id);
    }

    function burn(uint256 id) public {
        require(msg.sender == creatorOf(id), "Must be the creator of the token to burn");
        require(msg.sender == ERC721.ownerOf(id), "Must be the owner of the token to burn");

        _burn(id);
    }

    function _burn(uint256 id) internal override(ERC721, ERC721URIStorage) {
        super._burn(id);
    }

    function tokenURI(uint256 id) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(id);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
