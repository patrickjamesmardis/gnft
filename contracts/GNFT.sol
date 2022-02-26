// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract GNFT is ERC721, ERC721Enumerable, ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _ids;
    mapping(uint256 => address) private _artists;
    mapping(address => uint256) private _createdBalances;
    mapping(address => mapping(uint256 => uint256)) private _createdTokens;
    mapping(uint256 => uint256) _idToCreatedIndex;

    constructor() ERC721("G-NFT", "GNFT") {}

    function mintToken(string memory _tokenURI) public returns (uint256) {
        _ids.increment();
        uint256 newId = _ids.current();
        _safeMint(msg.sender, newId);
        _setTokenURI(newId, _tokenURI);
        _setArtistOf(newId, msg.sender);
        return newId;
    }

    function getArtistOf(uint256 id) public view returns (address) {
        return _artists[id];
    }

    function _setArtistOf(uint256 id, address artist) private {
        _artists[id] = artist;
        uint256 index = _createdBalances[artist];
        _createdBalances[artist] += 1;
        _createdTokens[artist][index] = id;
        _idToCreatedIndex[id] = index;
    }

    function getCreatedBalanceOf(address artist) public view returns (uint256) {
        return _createdBalances[artist];
    }

    function getCreatedTokenByIndex(address artist, uint256 idx)
        public
        view
        returns (uint256)
    {
        require(
            idx < getCreatedBalanceOf(artist),
            "artist index out of bounds"
        );
        return _createdTokens[artist][idx];
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 id
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, id);
    }

    function burn(uint256 id) public {
        require(
            msg.sender == _artists[id],
            "Must be the creator of the token to burn"
        );
        require(
            msg.sender == ERC721.ownerOf(id),
            "Must be the owner of the token to burn"
        );
        _createdBalances[msg.sender] -= 1;
        uint256 index = _idToCreatedIndex[id];
        uint256 lastIndex = _createdBalances[msg.sender];
        uint256 lastId = _createdTokens[msg.sender][lastIndex];
        _idToCreatedIndex[id] = 0;
        _idToCreatedIndex[lastId] = index;
        _createdTokens[msg.sender][index] = lastId;
        _createdTokens[msg.sender][lastIndex] = 0;
        _burn(id);
    }

    function _burn(uint256 id) internal override(ERC721, ERC721URIStorage) {
        super._burn(id);
    }

    function tokenURI(uint256 id)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(id);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
