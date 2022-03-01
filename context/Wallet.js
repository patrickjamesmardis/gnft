import { useRouter } from 'next/router';
import { createContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import WalletLink from 'walletlink';
import { create as ipftHttpClient } from 'ipfs-http-client';

import GNFT from '../artifacts/contracts/GNFT.sol/GNFT.json';
import GNFTMarket from '../artifacts/contracts/GNFTMarket.sol/GNFTMarket.json';
import { mumbaiTokenAddress, polygonTokenAddress, mumbaiMarketAddress } from './config';

export const WalletContext = createContext();

const client = ipftHttpClient({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: `Basic ${process.env.NEXT_PUBLIC_INFURA_IPFS}`,
  },
});

const deployedChainId = 80001;
const chainHex = `0x${deployedChainId.toString(16)}`;

const mumbaiRpc = `https://polygon-mumbai.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`;
const polygonRpc = `https://polygon-mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`;

const network = deployedChainId === 137 ? 'polygon' : 'mumbai';
const rpc = deployedChainId === 137 ? polygonRpc : mumbaiRpc;
const wrongNetwork =
  deployedChainId === 137
    ? 'Please connect your wallet to the Polygon Mainnet'
    : 'Please connect your wallet to the Mumbai Testnet';
const gnftAddress = deployedChainId === 137 ? polygonTokenAddress : mumbaiTokenAddress;
const marketAddress = mumbaiMarketAddress;

const Wallet = function ({ children }) {
  const [provider, setProvider] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [walletError, setWalletError] = useState(null);
  const [ipfsUrl, setIpfsUrl] = useState(null);
  const [isMinting, setIsMinting] = useState(false);
  const [gnftContract, setGnftContract] = useState(null);
  const [marketContract, setMarketContract] = useState(null);
  const [marketApproval, setMarketApproval] = useState(false);
  const [mintStatus, setMintStatus] = useState('Mint Sketch');
  const [mintModalOpen, setMintModalOpen] = useState(false);
  const [listItemModalOpen, setListItemModalOpen] = useState(false);
  const [sellStatus, setSellStatus] = useState('Sell GNFT');
  const [isSelling, setIsSelling] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState('Approve GNFT Market');
  const [isApproving, setIsApproving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelStatus, setCancelStatus] = useState('Cancel Sell');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState('Purchase GNFT');
  const router = useRouter();

  useEffect(async () => {
    const connectAccounts = async () => {
      if (provider?.provider) {
        provider.listAccounts().then((a) => {
          setAccounts(a);
        });
        provider.provider.on('accountsChanged', setAccounts);
        provider.provider.on('disconnect', () => setAccounts([]));
        provider.provider.on('chainChanged', (chainId) =>
          chainId !== deployedChainId && chainId !== chainHex ? setWalletError({ chainId }) : setWalletError(null)
        );
        provider.provider.on('message', console.log);

        const { chainId } = await provider.getNetwork();
        chainId !== deployedChainId && chainId !== chainHex ? setWalletError({ chainId }) : setWalletError(null);
      } else {
        setAccounts([]);
      }
    };
    connectAccounts();
  }, [provider]);

  const getApproval = async account => {
    const approval = await gnftContract.isApprovedForAll(account, marketAddress);
    setMarketApproval(approval);
  }

  useEffect(() => {
    if (accounts.length > 0) {
      setCurrentAccount(accounts[0]);
      getApproval(accounts[0]);
    } else {
      setCurrentAccount(null);
      setMarketApproval(false);
    }
  }, [accounts]);

  useEffect(() => {
    if (ipfsUrl) {
      mint(ipfsUrl);
    }
  }, [ipfsUrl]);

  const connect = async () => {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: process.env.NEXT_PUBLIC_INFURA_ID,
          chainId: deployedChainId,
          rpc: {
            80001: mumbaiRpc,
            137: polygonRpc,
          },
        },
      },
      walletlink: {
        package: WalletLink,
        options: {
          appName: 'GNFT',
          infuraId: process.env.NEXT_PUBLIC_INFURA_ID,
          chainId: deployedChainId,
          rpc,
        },
      },
    };

    try {
      const web3Modal = new Web3Modal({ providerOptions, cacheProvider: false });
      const instance = await web3Modal.connect();
      const eProvider = new ethers.providers.Web3Provider(instance);
      setGnftContract(new ethers.Contract(gnftAddress, GNFT.abi, eProvider));
      setMarketContract(new ethers.Contract(marketAddress, GNFTMarket.abi, eProvider));
      setProvider(eProvider);
    } catch (error) {
      console.log(error);
      setWalletError(error);
    }
  };

  const connectDefaultProvider = () => {
    const eProvider = new ethers.providers.JsonRpcProvider(rpc);
    const defaultTokenContract = new ethers.Contract(gnftAddress, GNFT.abi, eProvider);
    const defaultMarketContract = new ethers.Contract(marketAddress, GNFTMarket.abi, eProvider);
    setGnftContract(defaultTokenContract);
    setMarketContract(defaultMarketContract);
    return { defaultTokenContract, defaultMarketContract };
  };

  const mint = async () => {
    if (ipfsUrl && gnftContract && currentAccount) {
      setMintStatus('Approve the transaction in your wallet.');
      try {
        const tx = await gnftContract.connect(provider.getSigner()).mintToken(ipfsUrl);
        setMintStatus('Waiting on network confirmation.');
        const receipt = await tx.wait();
        const tokenId = receipt.events[0].args[2].toNumber();
        setMintStatus(`Successfully minted GNFT token #${tokenId}.`);
        setTimeout(() => {
          setMintModalOpen(false);
          router.push(`/token/${tokenId}`);
        }, [2000]);
      } catch (error) {
        console.log(error);
        setMintStatus('Error minting token.');
        setIpfsUrl(null);
        setTimeout(() => {
          setIsMinting(false);
          setMintModalOpen(false);
          setMintStatus('Mint Sketch');
        }, 5000);
      }
      setIpfsUrl(null);
      setTimeout(() => {
        setIsMinting(false);
        setMintModalOpen(false);
        setMintStatus('Mint Sketch');
      }, 5000);
    }
  };

  const listItem = async (tokenId, sellPrice) => {
    if (currentAccount && marketContract) {
      setIsSelling(true);
      setSellStatus('Approve the transaction in your wallet.');
      try {
        const tx = await marketContract.connect(provider.getSigner()).listItem(gnftAddress, tokenId, ethers.utils.parseEther(sellPrice.toString()));
        setSellStatus('Waiting on network confirmation.');
        await tx.wait();
        setSellStatus(`Successfully listed GNFT #${tokenId}`);
        setTimeout(() => {
          setListItemModalOpen(false);
        }, 5000);
      } catch (error) {
        console.log(error);
        setSellStatus('Error listing token.');
        setTimeout(() => {
          setSellStatus('Sell GNFT');
          setIsSelling(false);
          setListItemModalOpen(false);
        }, 5000);
      }

      setTimeout(() => {
        setIsSelling(false);
        setSellStatus('Sell GNFT');
        setListItemModalOpen(false);
      }, 5000)
    }
  };

  const getMarketApproval = async () => {
    setIsApproving(true);
    setApprovalStatus('Approve the transaction in your wallet.');
    if (currentAccount && gnftContract) {
      try {
        const tx = await gnftContract.connect(provider.getSigner()).setApprovalForAll(marketAddress, true);
        setApprovalStatus('Waiting on network confirmation.');
        await tx.wait();
        setApprovalStatus('Successfully approved GNFT Market.');
        setTimeout(() => {
          setIsApproving(false);
          setMarketApproval(true);
        }, 2000);
      } catch (error) {
        console.log(error);
        setApprovalStatus('Error approving GNFT Market.');
        setTimeout(() => {
          setIsApproving(false);
          setApprovalStatus('Approve GNFT Market');
        }, 2000);
      }

      setTimeout(() => {
        setApprovalStatus('Approve GNFT Market');
      }, 2000);
    }
  };

  const cancelSell = async itemId => {
    setIsCancelling(true);
    setCancelStatus('Approve the transaction in your wallet.');
    if (currentAccount && marketContract) {
      try {
        const tx = await marketContract.connect(provider.getSigner()).cancelSell(itemId);
        setCancelStatus('Waiting on network confirmation.');
        await tx.wait();
        setCancelStatus('Successfully cancelled sell.');
        setTimeout(() => {
          setIsCancelling(false);
          setCancelModalOpen(false);
        }, 2000);
      } catch (error) {
        console.log(error);
        setCancelStatus('Error cancelling sell.');
        setTimeout(() => {
          setIsCancelling(false);
          setCancelStatus('Cancel Sell');
          setCancelModalOpen(false);
        }, 2000);
      }

      setTimeout(() => {
        setCancelStatus('Cancel Sell');
      }, 2000);
    }
  };

  const purchaseItem = async (itemId, price) => {
    setIsPurchasing(true);
    setPurchaseStatus('Approve the transaction in your wallet.');
    if (currentAccount && marketContract) {
      try {
        const tx = await marketContract.connect(provider.getSigner()).purchaseItem(itemId, { value: price });
        setPurchaseStatus('Waiting on network confirmation');
        await tx.wait();
        setPurchaseStatus('Successfully purchased GNFT.');
        setTimeout(() => {
          setIsPurchasing(false);
          setPurchaseModalOpen(false);
        }, 2000);
      } catch (error) {
        console.log(error);
        if (error.data.message.match('insufficient funds')) {
          setPurchaseStatus('Insufficient funds to purchase GNFT.');
        } else {
          setPurchaseStatus('Error purchasing GNFT.');
        }

        setTimeout(() => {
          setIsPurchasing(false);
          setPurchaseStatus('Purchase GNFT');
          setPurchaseModalOpen(false);
        }, 2000);
      }

      setTimeout(() => {
        setPurchaseStatus('Purchase GNFT');
      }, 2000);
    }
  }

  const prettyAddress = (address) => {
    return address.match(/^0x[a-fA-F0-9]{40}$/) ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
  };

  const context = {
    network,
    connect,
    currentAccount,
    prettyAddress,
    walletError,
    client,
    isMinting,
    setIsMinting,
    setIpfsUrl,
    mintStatus,
    setMintStatus,
    sellStatus,
    gnftContract,
    marketContract,
    connectDefaultProvider,
    gnftAddress,
    marketAddress,
    wrongNetwork,
    mintModalOpen,
    setMintModalOpen,
    listItemModalOpen,
    setListItemModalOpen,
    isSelling,
    listItem,
    marketApproval,
    getMarketApproval,
    approvalStatus,
    isApproving,
    isCancelling,
    cancelStatus,
    cancelSell,
    cancelModalOpen,
    setCancelModalOpen,
    purchaseModalOpen,
    setPurchaseModalOpen,
    purchaseStatus,
    purchaseItem,
    isPurchasing
  };

  return <WalletContext.Provider value={context}>{children}</WalletContext.Provider>;
};

export default Wallet;
