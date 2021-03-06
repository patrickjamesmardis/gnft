const { expect } = require('chai');
const axios = require('axios');

describe('GNFT + GNFTMarket', () => {
  let market, gnft, owner, addr1, addr2, addr3, addr4, marketAddress, gnftAddress;
  let sellPrice = ethers.utils.parseUnits('100', 'ether');
  let tokenUri1 = 'https://token-uri-1.com';
  let tokenUri2 = 'https://token-uri-2.com';
  let nullAddress = '0x0000000000000000000000000000000000000000';

  beforeEach(async () => {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    const Market = await ethers.getContractFactory('GNFTMarket');
    market = await Market.deploy();
    await market.deployTransaction.wait();
    marketAddress = market.address;

    const GNFT = await ethers.getContractFactory('GNFT');
    gnft = await GNFT.deploy();
    await gnft.deployTransaction.wait();
    gnftAddress = gnft.address;

    await gnft.connect(owner).setApprovalForAll(marketAddress, true);
    await gnft.connect(addr1).setApprovalForAll(marketAddress, true);
    await gnft.connect(addr2).setApprovalForAll(marketAddress, true);
    await gnft.connect(addr3).setApprovalForAll(marketAddress, true);
    await gnft.connect(addr4).setApprovalForAll(marketAddress, true);
  });

  describe('GNFT.mintToken()', () => {
    it('Should mint a new token owned by the caller', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      const balance = await gnft.balanceOf(addr1.address);
      const marketBalance = await gnft.balanceOf(marketAddress);
      expect(balance.toNumber()).to.equal(1);
      expect(marketBalance.toNumber()).to.equal(0);
    });

    it('Should store the correct token URI', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr2).mintToken(tokenUri2);

      const uri1 = await gnft.tokenURI(1);
      const uri2 = await gnft.tokenURI(2);

      expect(uri1).to.equal(tokenUri1);
      expect(uri2).to.equal(tokenUri2);
    });

    it('Should store the correct artist address', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr2).mintToken(tokenUri2);

      const artist1 = await gnft.creatorOf(1);
      const artist2 = await gnft.creatorOf(2);

      expect(artist1).to.equal(addr1.address);
      expect(artist2).to.equal(addr2.address);
    });

    it('Should store the correct created balance', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      let balance = await gnft.createdBalanceOf(addr1.address);
      expect(balance.toNumber()).to.equal(1);

      await gnft.connect(addr1).mintToken(tokenUri1);
      balance = await gnft.createdBalanceOf(addr1.address);
      expect(balance.toNumber()).to.equal(2);

      await gnft.connect(addr1).mintToken(tokenUri1);
      balance = await gnft.createdBalanceOf(addr1.address);
      expect(balance.toNumber()).to.equal(3);

      await gnft.connect(addr2).mintToken(tokenUri1);
      const balance2 = await gnft.createdBalanceOf(addr2.address);
      expect(balance.toNumber()).to.equal(3);
      expect(balance2.toNumber()).to.equal(1);
    });
  });

  describe('GNFT.tokenOfCreatorByIndex()', () => {
    it('Should access the correct created token', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri2);
      await gnft.connect(addr1).mintToken(tokenUri1);

      const token1 = await gnft.tokenOfCreatorByIndex(addr1.address, 0);
      const token2 = await gnft.tokenOfCreatorByIndex(addr1.address, 1);
      const token3 = await gnft.tokenOfCreatorByIndex(addr1.address, 2);

      expect(token1.toNumber()).to.equal(1);
      expect(token2.toNumber()).to.equal(2);
      expect(token3.toNumber()).to.equal(3);
    });

    it('Should not access uncreated tokens', async () => {
      await expect(gnft.tokenOfCreatorByIndex(addr1.address, 0)).to.be.reverted;
    });
  });

  describe('GNFT.tokenOfCreatorByPage', () => {
    it('Should return the correct items', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri2);

      const tokens1 = await gnft.tokensOfCreatorByPage(addr1.address, 6, 1);
      const tokens2 = await gnft.tokensOfCreatorByPage(addr1.address, 6, 2);
      expect(tokens1).to.be.an('array').that.has.lengthOf(6);
      expect(tokens2).to.be.an('array').that.has.lengthOf(1);

      for (let i = 0; i < 6; i++) {
        expect(tokens1[i].id.toNumber()).to.equal(i + 1);
        expect(tokens1[i].tokenURI).to.equal(tokenUri1);
      }
      expect(tokens2[0].id.toNumber()).to.equal(7);
      expect(tokens2[0].tokenURI).to.equal(tokenUri2);
    });

    it('Should not get invalid pages/page sizes', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);

      await expect(gnft.tokensOfCreatorByPage(addr1.address, 6, 0)).to.be.reverted;
      await expect(gnft.tokensOfCreatorByPage(addr1.address, 6, 2)).to.be.reverted;

      await expect(gnft.tokensOfCreatorByPage(addr1.address, 0, 1)).to.be.reverted;
      await expect(gnft.tokensOfCreatorByPage(addr1.address, 101, 1)).to.be.reverted;
    });
  });

  describe('GNFT.tokensOfOwnerByPage', () => {
    it('Should return the correct items', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri2);

      const tokens1 = await gnft.tokensOfOwnerByPage(addr1.address, 6, 1);
      const tokens2 = await gnft.tokensOfOwnerByPage(addr1.address, 6, 2);
      expect(tokens1).to.be.an('array').that.has.lengthOf(6);
      expect(tokens2).to.be.an('array').that.has.lengthOf(1);

      for (let i = 0; i < 6; i++) {
        expect(tokens1[i].id.toNumber()).to.equal(i + 1);
        expect(tokens1[i].tokenURI).to.equal(tokenUri1);
      }
      expect(tokens2[0].id.toNumber()).to.equal(7);
      expect(tokens2[0].tokenURI).to.equal(tokenUri2);
    });

    it('Should not get invalid pages/page sizes', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);

      await expect(gnft.tokensOfOwnerByPage(addr1.address, 6, 0)).to.be.reverted;
      await expect(gnft.tokensOfOwnerByPage(addr1.address, 6, 2)).to.be.reverted;

      await expect(gnft.tokensOfOwnerByPage(addr1.address, 0, 1)).to.be.reverted;
      await expect(gnft.tokensOfOwnerByPage(addr1.address, 101, 1)).to.be.reverted;
    });
  });

  describe('GNFT.supportsInterface()', () => {
    it('Should support ERC721', async () => {
      const support = await gnft.supportsInterface(0x80ac58cd);
      expect(support).to.be.true;
    });
  });
  describe('GNFTMarket.deploy()', () => {
    it('Should store the correct owner address', async () => {
      const marketOwner = await market.owner();
      expect(marketOwner).to.equal(owner.address);
    });
  });

  describe('GNFTMarket.listItem()', () => {
    it('Should transfer the token from the seller to the market', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);

      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);

      const addr1Balance = await gnft.balanceOf(addr1.address);
      const marketBalance = await gnft.balanceOf(marketAddress);

      expect(addr1Balance.toNumber()).to.equal(0);
      expect(marketBalance.toNumber()).to.equal(1);
    });

    it('Should store the correct GNFT contract address', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr2).mintToken(tokenUri1);

      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr2).listItem(gnftAddress, 2, sellPrice);

      const items = await market.getPaginatedItems(6, 1);
      expect(items[0].tokenContract).to.equal(gnftAddress);
      expect(items[1].tokenContract).to.equal(gnftAddress);
    });

    it('Should store the correct artist address', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr2).mintToken(tokenUri2);

      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr2).listItem(gnftAddress, 2, sellPrice);

      const items = await market.getPaginatedItems(6, 1);
      expect(items).to.be.an('array').that.has.lengthOf(2);
      expect(items[0].creator).to.equal(addr1.address);
      expect(items[1].creator).to.equal(addr2.address);
    });

    it('Should store the correct seller address', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr2).mintToken(tokenUri2);

      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr2).listItem(gnftAddress, 2, sellPrice);

      const items = await market.getPaginatedItems(6, 1);
      expect(items).to.be.an('array').that.has.lengthOf(2);
      expect(items[0].seller).to.equal(addr1.address);
      expect(items[1].seller).to.equal(addr2.address);
    });

    it('Should store the correct price', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr2).mintToken(tokenUri2);

      const sellPrice2 = ethers.utils.parseUnits('50', 'ether');

      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr2).listItem(gnftAddress, 2, sellPrice2);

      const items = await market.getPaginatedItems(6, 1);
      expect(items).to.be.an('array').that.has.lengthOf(2);
      expect(items[0].price).to.equal(sellPrice.toString());
      expect(items[1].price).to.equal(sellPrice2.toString());
    });

    it('Should store the correct token ID', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri2);
      await gnft.connect(addr2).mintToken(tokenUri1);
      await gnft.connect(addr2).mintToken(tokenUri2);
      await gnft.connect(addr3).mintToken(tokenUri1);
      await gnft.connect(addr3).mintToken(tokenUri2);

      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr1).listItem(gnftAddress, 2, sellPrice);
      await market.connect(addr2).listItem(gnftAddress, 3, sellPrice);
      await market.connect(addr2).listItem(gnftAddress, 4, sellPrice);
      await market.connect(addr3).listItem(gnftAddress, 5, sellPrice);
      await market.connect(addr3).listItem(gnftAddress, 6, sellPrice);

      const items = await market.getPaginatedItems(6, 1);
      expect(items).to.be.an('array').that.has.lengthOf(6);
      expect(items[0].tokenId.toNumber()).to.equal(1);
      expect(items[1].tokenId.toNumber()).to.equal(2);
      expect(items[2].tokenId.toNumber()).to.equal(3);
      expect(items[3].tokenId.toNumber()).to.equal(4);
      expect(items[4].tokenId.toNumber()).to.equal(5);
      expect(items[5].tokenId.toNumber()).to.equal(6);
    });

    it('Should set the owner address to 0x00', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr2).mintToken(tokenUri2);

      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr2).listItem(gnftAddress, 2, sellPrice);

      const items = await market.getPaginatedItems(6, 1);
      expect(items).to.be.an('array').that.has.lengthOf(2);
      expect(items[0].owner).to.equal(nullAddress);
      expect(items[1].owner).to.equal(nullAddress);
    });

    it('Should set sold to false', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr2).mintToken(tokenUri2);

      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr2).listItem(gnftAddress, 2, sellPrice);

      const items = await market.getPaginatedItems(6, 1);
      expect(items).to.be.an('array').that.has.lengthOf(2);
      expect(items[0].sold).to.be.false;
      expect(items[1].sold).to.be.false;
    });

    it('Should not create an item from another account', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri2);
      await gnft.connect(addr2).mintToken(tokenUri1);
      await gnft.connect(addr2).mintToken(tokenUri2);
      await gnft.connect(addr3).mintToken(tokenUri1);

      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr2).listItem(gnftAddress, 3, sellPrice);

      await expect(market.connect(addr2).listItem(gnftAddress, 2, sellPrice)).to.be.reverted;
      await expect(market.connect(addr1).listItem(gnftAddress, 5, sellPrice)).to.be.reverted;
      await expect(market.connect(addr3).listItem(gnftAddress, 4, sellPrice)).to.be.reverted;
    });

    it('Should not create an item for an invalid token ID', async () => {
      await expect(market.connect(addr1).listItem(gnftAddress, 1, sellPrice)).to.be.reverted;
      await expect(market.connect(addr2).listItem(gnftAddress, 2, sellPrice)).to.be.reverted;
      await expect(market.connect(addr3).listItem(gnftAddress, 3, sellPrice)).to.be.reverted;
    });

    it('Should not recreate an item', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await expect(market.connect(addr1).listItem(gnftAddress, 1, sellPrice)).to.be.reverted;
    });

    it('Should not create an item with price = 0', async () => {
      const zero = ethers.utils.parseUnits('0', 'ether');
      await gnft.connect(addr1).mintToken(tokenUri1);
      await expect(market.connect(addr1).listItem(gnftAddress, 1, 0)).to.be.reverted;
      await expect(market.connect(addr1).listItem(gnftAddress, 1, zero)).to.be.reverted;
    });
  });

  describe('GNFTMarket.getTotalUnsoldItems()', () => {
    it('Should return the correct number of unsold items', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);

      let totalUnsold = await market.getTotalUnsoldItems();
      expect(totalUnsold.toNumber()).to.equal(0);

      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      totalUnsold = await market.getTotalUnsoldItems();
      expect(totalUnsold.toNumber()).to.equal(1);

      await market.connect(addr1).listItem(gnftAddress, 2, sellPrice);
      totalUnsold = await market.getTotalUnsoldItems();
      expect(totalUnsold.toNumber()).to.equal(2);

      await market.connect(addr1).listItem(gnftAddress, 3, sellPrice);
      totalUnsold = await market.getTotalUnsoldItems();
      expect(totalUnsold.toNumber()).to.equal(3);

      await market.connect(addr2).purchaseItem(1, { value: sellPrice });
      totalUnsold = await market.getTotalUnsoldItems();
      expect(totalUnsold.toNumber()).to.equal(2);

      await market.connect(addr2).purchaseItem(2, { value: sellPrice });
      totalUnsold = await market.getTotalUnsoldItems();
      expect(totalUnsold.toNumber()).to.equal(1);

      await market.connect(addr1).cancelSell(3);
      totalUnsold = await market.getTotalUnsoldItems();
      expect(totalUnsold.toNumber()).to.equal(0);
    });
  });

  describe('GNFTMarket.getUnsoldItemByIndex()', () => {
    it('Should get the correct items', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);

      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr1).listItem(gnftAddress, 2, sellPrice);
      await market.connect(addr1).listItem(gnftAddress, 3, sellPrice);

      let item = await market.getUnsoldItemByIndex(0);
      expect(item.toNumber()).to.equal(1);
      item = await market.getUnsoldItemByIndex(1);
      expect(item.toNumber()).to.equal(2);
      item = await market.getUnsoldItemByIndex(2);
      expect(item.toNumber()).to.equal(3);

      await market.connect(addr2).purchaseItem(1, { value: sellPrice });
      item = await market.getUnsoldItemByIndex(0);
      expect(item.toNumber()).to.equal(3);
      item = await market.getUnsoldItemByIndex(1);
      expect(item.toNumber()).to.equal(2);

      await market.connect(addr1).cancelSell(3);
      item = await market.getUnsoldItemByIndex(0);
      expect(item.toNumber()).to.equal(2);
    });

    it('Should not get an out of bounds item', async () => {
      await expect(market.getUnsoldItemByIndex(0)).to.be.reverted;
    });
  });

  describe('GNFTMarket.getPaginatedItems()', () => {
    it('Should get the correct items', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri1);

      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr1).listItem(gnftAddress, 2, sellPrice);
      await market.connect(addr1).listItem(gnftAddress, 3, sellPrice);
      await market.connect(addr1).listItem(gnftAddress, 4, sellPrice);
      await market.connect(addr1).listItem(gnftAddress, 5, sellPrice);
      await market.connect(addr1).listItem(gnftAddress, 6, sellPrice);
      await market.connect(addr1).listItem(gnftAddress, 7, sellPrice);

      const items1 = await market.getPaginatedItems(6, 1);
      const items2 = await market.getPaginatedItems(6, 2);

      expect(items1).to.be.an('array').that.has.lengthOf(6);
      expect(items2).to.be.an('array').that.has.lengthOf(1);
    });

    it('Should not get invalid pages/page sizes', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);

      await expect(market.getPaginatedItems(6, 0)).to.be.reverted;
      await expect(market.getPaginatedItems(6, 2)).to.be.reverted;

      await expect(market.getPaginatedItems(0, 1)).to.be.reverted;
      await expect(market.getPaginatedItems(101, 1)).to.be.reverted;
    });
  });

  describe('GNFTMarket.cancelSell()', () => {
    it('Should not cancel the sell of an item that does not exist', async () => {
      await expect(market.connect(addr1).cancelSell(1)).to.be.reverted;
    });

    it('Should not allow a non-seller to cancel a sell', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await expect(market.connect(addr2).cancelSell(1)).to.be.reverted;
    });

    it('Should not cancel an item that is sold', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr2).purchaseItem(1, { value: sellPrice });
      await expect(market.connect(addr1).cancelSell(1)).to.be.reverted;
    });
  });

  describe('GNFTMarket.getGNFTItem()', () => {
    it('Should get the most recent sale', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await gnft.connect(addr2).setApprovalForAll(marketAddress, true);
      const item1 = await market.getGNFTItem(1);
      const id1 = item1.itemId.toNumber();
      const tokenId1 = item1.tokenId.toNumber();
      const artist1 = item1.creator;
      const seller1 = item1.seller;
      expect(id1).to.equal(1);
      expect(tokenId1).to.equal(1);
      expect(artist1).to.equal(addr1.address);
      expect(seller1).to.equal(addr1.address);

      await market.connect(addr2).purchaseItem(1, { value: sellPrice });
      await market.connect(addr2).listItem(gnftAddress, 1, sellPrice);
      const item2 = await market.getGNFTItem(1);
      const id2 = item2.itemId.toNumber();
      const tokenId2 = item2.tokenId.toNumber();
      const artist2 = item2.creator;
      const seller2 = item2.seller;
      expect(id2).to.equal(2);
      expect(tokenId2).to.equal(1);
      expect(artist2).to.equal(addr1.address);
      expect(seller2).to.equal(addr2.address);
    });

    it('Should return an empty item for an invalid id', async () => {
      const item = await market.getGNFTItem(1);
      let { itemId, tokenId, creator, seller } = item;
      expect(itemId.toNumber()).to.equal(0);
      expect(tokenId.toNumber()).to.equal(0);
      expect(creator).to.equal(nullAddress);
      expect(seller).to.equal(nullAddress);
    });
  });

  describe('GNFTMarket.purchaseItem()', () => {
    it('Should transfer the token from the market to the buyer', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri2);
      await gnft.connect(addr2).mintToken(tokenUri1);
      await gnft.connect(addr2).mintToken(tokenUri2);

      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr1).listItem(gnftAddress, 2, sellPrice);
      await market.connect(addr2).listItem(gnftAddress, 3, sellPrice);
      await market.connect(addr2).listItem(gnftAddress, 4, sellPrice);

      await market.connect(addr3).purchaseItem(1, { value: sellPrice });
      await market.connect(addr3).purchaseItem(3, { value: sellPrice });
      await market.connect(addr3).purchaseItem(4, { value: sellPrice });
      await market.connect(addr4).purchaseItem(2, { value: sellPrice });

      const addr4Balance = await gnft.balanceOf(addr4.address);
      const addr3Balance = await gnft.balanceOf(addr3.address);
      const marketBalance = await gnft.balanceOf(marketAddress);
      expect(addr3Balance.toNumber()).to.equal(3);
      expect(addr4Balance.toNumber()).to.equal(1);
      expect(marketBalance.toNumber()).to.equal(0);
    });

    it('Should transfer 98% of the sell price to the seller if the seller is the artist', async () => {
      let artistStart = await addr1.getBalance();
      artistStart = ethers.utils.formatEther(artistStart);

      await gnft.connect(addr1).mintToken(tokenUri1);
      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr2).purchaseItem(1, { value: sellPrice });

      let artistEnd = await addr1.getBalance();
      artistEnd = ethers.utils.formatEther(artistEnd);

      const artistGain = artistEnd - artistStart;

      const sellPriceETH = ethers.utils.formatEther(sellPrice);
      expect(artistGain)
        .to.be.above(sellPriceETH * 0.98 - 0.1)
        .and.below(sellPriceETH * 0.98 + 0.00001);
    });

    it('Should transfer the sell price (plus gas) from the buyer', async () => {
      let buyerStart = await addr2.getBalance();
      buyerStart = ethers.utils.formatEther(buyerStart);

      await gnft.connect(addr1).mintToken(tokenUri1);
      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr2).purchaseItem(1, { value: sellPrice });

      let buyerEnd = await addr2.getBalance();
      buyerEnd = ethers.utils.formatEther(buyerEnd);

      const buyerLoss = buyerStart - buyerEnd;

      const sellPriceETH = ethers.utils.formatEther(sellPrice);
      expect(buyerLoss)
        .to.be.above(sellPriceETH * 1 - 0.00001)
        .and.below(sellPriceETH * 1 + 0.001);
    });

    it('Should correctly resell an item', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr2).purchaseItem(1, { value: sellPrice });

      await gnft.connect(addr2).setApprovalForAll(marketAddress, true);
      await market.connect(addr2).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr3).purchaseItem(2, { value: sellPrice });

      const addr1Balance = await gnft.balanceOf(addr1.address);
      const addr2Balance = await gnft.balanceOf(addr2.address);
      const addr3Balance = await gnft.balanceOf(addr3.address);
      const marketBalance = await gnft.balanceOf(marketAddress);

      expect(addr1Balance.toNumber()).to.equal(0);
      expect(addr2Balance.toNumber()).to.equal(0);
      expect(addr3Balance.toNumber()).to.equal(1);
      expect(marketBalance.toNumber()).to.equal(0);
      await expect(market.getPaginatedItems(6, 1)).to.be.reverted;
    });

    it('Should transfer the correct royalties on a resell', async () => {
      const addr1Start = await addr1.getBalance();
      const addr2Start = await addr2.getBalance();
      const addr3Start = await addr3.getBalance();

      await gnft.connect(addr1).mintToken(tokenUri1);
      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr2).purchaseItem(1, { value: sellPrice });

      const addr1Mid = await addr1.getBalance();
      const addr2Mid = await addr2.getBalance();
      const addr3Mid = await addr3.getBalance();

      let addr1Diff = ethers.utils.formatEther(addr1Mid) - ethers.utils.formatEther(addr1Start);
      let addr2Diff = ethers.utils.formatEther(addr2Mid) - ethers.utils.formatEther(addr2Start);
      let addr3Diff = ethers.utils.formatEther(addr3Mid) - ethers.utils.formatEther(addr3Start);

      expect(addr1Diff).to.be.above(97.999).and.below(98.001);
      expect(addr2Diff).to.be.above(-101.001).and.below(-99.999);
      expect(addr3Diff).to.equal(0);

      await gnft.connect(addr2).setApprovalForAll(marketAddress, true);
      await market.connect(addr2).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr3).purchaseItem(2, { value: sellPrice });

      const addr1End = await addr1.getBalance();
      const addr2End = await addr2.getBalance();
      const addr3End = await addr3.getBalance();

      addr1Diff = ethers.utils.formatEther(addr1End) - ethers.utils.formatEther(addr1Mid);
      addr2Diff = ethers.utils.formatEther(addr2End) - ethers.utils.formatEther(addr2Mid);
      addr3Diff = ethers.utils.formatEther(addr3End) - ethers.utils.formatEther(addr3Mid);

      expect(addr1Diff).to.be.above(19.999).and.below(20.001);
      expect(addr2Diff).to.be.above(77.999).and.below(78.001);
      expect(addr3Diff).to.be.above(-101.001).and.below(-99.999);
    });

    it('Should not purchase a token if the sell price is not sent', async () => {
      const zero = ethers.utils.parseUnits('0', 'ether');
      await gnft.connect(addr1).mintToken(tokenUri1);
      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);

      await expect(market.connect(addr2).purchaseItem(1, { value: sellPrice - 10 })).to.be.reverted;
      await expect(market.connect(addr2).purchaseItem(1)).to.be.reverted;
      await expect(market.connect(addr2).purchaseItem(1, 0)).to.be.reverted;
      await expect(market.connect(addr2).purchaseItem(1, zero)).to.be.reverted;

      const items = await market.getPaginatedItems(6, 1);
      expect(items).to.be.an('array').that.has.lengthOf(1);
    });

    it('Should not purchase a token created by the caller', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);

      await expect(market.connect(addr1).purchaseItem(1, { value: sellPrice })).to.be.reverted;
      const items = await market.connect(addr1).getPaginatedItems(6, 1);
      expect(items).to.be.an('array').that.has.lengthOf(1);
    });

    it('Should not purchase a token that does not exist', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);

      await expect(market.connect(addr2).purchaseItem(1, { value: sellPrice })).to.be.reverted;
      await expect(market.connect(addr1).purchaseItem(2, { value: sellPrice })).to.be.reverted;
    });

    it('Should not purchase a token that has already been sold', async () => {
      await gnft.connect(addr1).mintToken(tokenUri1);
      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr2).purchaseItem(1, { value: sellPrice });

      await expect(market.connect(addr3).purchaseItem(1, { value: sellPrice })).to.be.reverted;
    });
  });

  describe('GNFTMarket.cashOut()', () => {
    it('Should transfer funds from the market to the market owner', async () => {
      const startBalance = await owner.getBalance();

      await gnft.connect(addr1).mintToken(tokenUri1);
      await gnft.connect(addr1).mintToken(tokenUri2);

      await market.connect(addr1).listItem(gnftAddress, 1, sellPrice);
      await market.connect(addr1).listItem(gnftAddress, 2, sellPrice);

      await market.connect(addr2).purchaseItem(1, { value: sellPrice });
      await market.connect(addr2).purchaseItem(2, { value: sellPrice });

      await market.connect(owner).cashOut();

      const endBalance = await owner.getBalance();
      const diff = ethers.utils.formatEther(endBalance) - ethers.utils.formatEther(startBalance);

      expect(diff).to.be.above(3.99).and.below(4.001);
    });

    it('Should only let the owner cashout', async () => {
      await expect(market.connect(addr2).cashOut()).to.be.reverted;
    });
  });
});
