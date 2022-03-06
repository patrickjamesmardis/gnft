// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

abstract contract GNFTArtistEnumerable is ERC721 {
    mapping(uint256 => address) private _creators;
    mapping(address => uint256) private _createdBalances;
    mapping(address => mapping(uint256 => uint256)) private _createdTokens;
    mapping(uint256 => uint256) _idToCreatedIndex;

    function creatorOf(uint256 id) public virtual view returns (address) {
        return _creators[id];
    }

    function _setCreatorOf(uint256 id, address creator) internal virtual {
        _creators[id] = creator;
        uint256 index = _createdBalances[creator];
        _createdBalances[creator] += 1;
        _createdTokens[creator][index] = id;
        _idToCreatedIndex[id] = index;
    }

    function createdBalanceOf(address creator) public virtual view returns (uint256) {
        return _createdBalances[creator];
    }

    function tokenOfCreatorByIndex(address creator, uint256 idx) public virtual view returns (uint256) {
        require(idx < createdBalanceOf(creator), "creator index out of bounds");
        return _createdTokens[creator][idx];
    }

    function _removeFromCreatedEnumeration(address creator, uint256 id) internal virtual {
        _createdBalances[creator] -= 1;
        uint256 index = _idToCreatedIndex[id];
        uint256 lastIndex = _createdBalances[creator];
        uint256 lastId = _createdTokens[creator][lastIndex];
        _idToCreatedIndex[id] = 0;
        _idToCreatedIndex[lastId] = index;
        _createdTokens[creator][index] = lastId;
        _createdTokens[creator][lastIndex] = 0;
    }
}