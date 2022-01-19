// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract GNFT is ERC721, ERC721Enumerable, ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _ids;
    address private _marketContract;
    mapping(uint256 => address) private _artists;

    constructor(address marketAddress) ERC721("GeNFT", "GNFT") {
        _marketContract = marketAddress;
    }

    function getMarketAddress() public view returns (address) {
        return _marketContract;
    }

    function mintToken(string memory _tokenURI) public returns (uint256) {
        _ids.increment();
        uint256 newId = _ids.current();
        _safeMint(msg.sender, newId);
        _setTokenURI(newId, _tokenURI);
        _setArtistOf(newId, msg.sender);
        setApprovalForAll(_marketContract, true);
        return newId;
    }

    function getArtistOf(uint256 id) public view returns (address) {
        return _artists[id];
    }

    function _setArtistOf(uint256 id, address artist) private {
        _artists[id] = artist;
    }

    function _beforeTokenTransfer(address from, address to, uint256 id) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, id);
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
