import { BigNumber } from "ethers";

const mumbaiTokenAddress = '0x1EC368787CC7Be5edb42b016D0937ca0b180B56F';
const mumbaiMarketAddress = '0xE765aE0f6A8A4a14a9157Ac7f67e863EEA3e727b';
// const polygonTokenAddress = '0xFE45483C912C8Fc82e5eBBED66011385c6d6cbac';
// const polygonMarketAddress = '0x605D60B998D8f6a3d23a47b28ec77d3dbAaabd8E';
export const deployedChainId = 80001;
export const chainHex = `0x${deployedChainId.toString(16)}`;
export const networkName = 'Mumbai';
export const rpc = `https://polygon-mumbai.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`;
export const rpcUrls = ['https://rpc-mumbai.maticvigil.com'];
export const blockExplorerUrls = ['https://mumbai.polygonscan.com'];
export const wrongNetwork = 'Please connect your wallet to the Mumbai Testnet';
export const gnftAddress = mumbaiTokenAddress.toLowerCase();
export const marketAddress = mumbaiMarketAddress.toLowerCase();

export type MetadataType = {
    artist: string,
    description: string,
    image: string,
    name: string,
    sourceCode: string
};
