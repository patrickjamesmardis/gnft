import { useRouter } from 'next/router';
import { createContext, useEffect, useState } from 'react';
import { BigNumber, ethers } from 'ethers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import WalletLink from 'walletlink';
import GNFT from '../artifacts/contracts/GNFT.sol/GNFT.json';
import GNFTMarket from '../artifacts/contracts/GNFTMarket.sol/GNFTMarket.json';
import { GNFT as GNFTType, GNFTMarket as GNFTMarketType } from '../types';
import { gnftAddress, marketAddress, rpc, rpcUrls, blockExplorerUrls, chainHex, deployedChainId, networkName } from './config';


type WalletContextType = {
  connect: () => Promise<void>,
  currentAccount: string,
  walletError: any,
  isMinting: boolean,
  setIsMinting: React.Dispatch<React.SetStateAction<boolean>>,
  setIpfsUrl: React.Dispatch<React.SetStateAction<string>>,
  mintStatus: string,
  setMintStatus: React.Dispatch<React.SetStateAction<string>>,
  sellStatus: string,
  gnftContract: GNFTType,
  marketContract: GNFTMarketType,
  mintModalOpen: boolean,
  setMintModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
  listItemModalOpen: boolean,
  setListItemModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
  isSelling: boolean,
  listItem: (tokenId: string, sellPrice: number) => Promise<void>,
  marketApproval: boolean,
  getMarketApproval: () => Promise<void>,
  approvalStatus: string,
  isApproving: boolean,
  isCancelling: boolean,
  cancelStatus: string,
  cancelSell: (itemId: BigNumber) => Promise<void>,
  cancelModalOpen: boolean,
  setCancelModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
  purchaseModalOpen: boolean,
  setPurchaseModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
  purchaseStatus: string,
  purchaseItem: (itemId: BigNumber, price: BigNumber) => Promise<void>,
  isPurchasing: boolean
};

export const WalletContext = createContext<WalletContextType | null>(null);

export const connectDefaultProvider = () => {
  const provider = new ethers.providers.JsonRpcProvider(rpc);
  const tokenContract = new ethers.Contract(gnftAddress, GNFT.abi, provider) as GNFTType;
  const marketContract = new ethers.Contract(marketAddress, GNFTMarket.abi, provider) as GNFTMarketType;
  return { tokenContract, marketContract, provider };
};

export const rpcProvider = connectDefaultProvider();

export const prettyAddress = (address: string) => {
  return address.match(/^0x[a-fA-F0-9]{40}$/) ? `${address.slice(0, 6)}...${address.slice(-4)}`.toLowerCase() : address;
};

const Wallet = function ({ children }) {
  const [provider, setProvider] = useState(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [currentAccount, setCurrentAccount] = useState<string>(null);
  const [walletError, setWalletError] = useState(null);
  const [ipfsUrl, setIpfsUrl] = useState<string>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [gnftContract, setGnftContract] = useState<GNFTType>(null);
  const [marketContract, setMarketContract] = useState<GNFTMarketType>(null);
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

  useEffect(() => {
    const connectAccounts = async () => {
      if (provider?.provider) {
        let account: string;
        provider.listAccounts().then((a) => {
          setAccounts(a);
          account = a[0];
        });
        provider.provider.on('accountsChanged', setAccounts);
        provider.provider.on('disconnect', () => {
          setAccounts([]);
          setProvider(null);
        });
        provider.provider.on('chainChanged', () => {
          setAccounts([]);
          setProvider(null);
        });
        provider.provider.on('message', console.log);

        const { chainId } = await provider.getNetwork();
        if (chainId !== deployedChainId && chainId !== chainHex) {
          provider.send('wallet_switchEthereumChain', [{ chainId: chainHex }]).then(() => {
            connect();
          }).catch(() => {
            provider.send('wallet_addEthereumChain', [{
              chainId: chainHex,
              chainName: networkName,
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
              },
              rpcUrls,
              blockExplorerUrls
            }]).then(() => {
              connect();
            }).catch(() => {
              setWalletError({ chainId });
            });
          });
        } else {
          getApproval(account);
        }
      } else {
        setAccounts([]);
      }
    };
    connectAccounts();
  }, [provider]);

  const getApproval = async (account: string) => {
    const approval = await gnftContract.isApprovedForAll(account, marketAddress);
    setMarketApproval(approval);
  }

  useEffect(() => {
    if (accounts.length > 0) {
      setCurrentAccount(accounts[0].toLowerCase());
    } else {
      setCurrentAccount(null);
      setMarketApproval(false);
    }
  }, [accounts]);

  useEffect(() => {
    if (ipfsUrl) {
      mint();
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
            [deployedChainId]: rpc
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
      setGnftContract(new ethers.Contract(gnftAddress, GNFT.abi, eProvider) as GNFTType);
      setMarketContract(new ethers.Contract(marketAddress, GNFTMarket.abi, eProvider) as GNFTMarketType);
      setProvider(eProvider);
    } catch (error) {
      console.log(error);
      setWalletError(error);
    }
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
        }, 2000);
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

  const listItem = async (tokenId: string, sellPrice: number) => {
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

  const cancelSell = async (itemId: BigNumber) => {
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

  const purchaseItem = async (itemId: BigNumber, price: BigNumber) => {
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

  const context = {
    connect,
    currentAccount,
    walletError,
    isMinting,
    setIsMinting,
    setIpfsUrl,
    mintStatus,
    setMintStatus,
    sellStatus,
    gnftContract,
    marketContract,
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
