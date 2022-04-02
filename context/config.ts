import { BigNumber } from 'ethers';
const mumbaiTokenAddress = '0xE64E2Bc6693c5dC2c1b88302973346497A731cE0';
const mumbaiMarketAddress = '0x8E4c5943A78766c436dc7A7d97f1f80f660Ac280';
export const deployedChainId = 80001;
export const chainHex = `0x${deployedChainId.toString(16)}`;
export const networkName = 'Mumbai';
export const rpc = `https://polygon-mumbai.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_MUMBAI_KEY}`;
export const rpcUrls = ['https://rpc-mumbai.maticvigil.com'];
export const blockExplorerUrls = ['https://mumbai.polygonscan.com'];
export const wrongNetwork = 'Please connect your wallet to the Mumbai Testnet';
export const gnftAddress = mumbaiTokenAddress.toLowerCase();
export const marketAddress = mumbaiMarketAddress.toLowerCase();
export const createdBlock = 25606779;
export const gasStation = 'https://gasstation-mumbai.matic.today/v2';

export type Metadata = {
  artist: string;
  description: string;
  image: string;
  name: string;
  sourceCode: string;
};

export type Transaction = {
  blockNum: number;
  from: string;
  to: string;
  details: string;
  hash: string;
};

export type Token = {
  id: BigNumber;
  tokenURI: string;
  owner: string;
  creator: string;
  seller?: string;
  itemId?: BigNumber;
  price?: BigNumber;
};

type GasData = {
  maxPriorityFee: number;
  maxFee: number;
};

export type GasStationData = {
  safeLow: GasData;
  standard: GasData;
  fast: GasData;
  estimatedBaseFee: number;
  blockTime: number;
  blockNumber: number;
};
