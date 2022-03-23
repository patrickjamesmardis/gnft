import { createContext, Dispatch, SetStateAction, useEffect, useState } from 'react';
import { ethers } from 'ethers';
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
  gnftContract: GNFTType,
  marketApproval: boolean,
  marketContract: GNFTMarketType,
  provider: any,
  setMarketApproval: Dispatch<SetStateAction<boolean>>,
  walletError: any
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
  const [accounts, setAccounts] = useState<string[]>([]);
  const [currentAccount, setCurrentAccount] = useState<string>(null);
  const [gnftContract, setGnftContract] = useState<GNFTType>(null);
  const [marketApproval, setMarketApproval] = useState(false);
  const [marketContract, setMarketContract] = useState<GNFTMarketType>(null);
  const [provider, setProvider] = useState(null);
  const [walletError, setWalletError] = useState(null);

  useEffect(() => {
    const connectAccounts = async () => {
      if (provider?.provider) {
        let account: string;
        provider.listAccounts().then((a: string[]) => {
          setAccounts(a);
          account = a[0];
        });

        const handleDisconnect = () => {
          setAccounts([]);
          setProvider(null);
        }

        provider.provider.on('accountsChanged', setAccounts);
        provider.provider.on('disconnect', handleDisconnect);
        provider.provider.on('chainChanged', handleDisconnect);
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
          const approval = await gnftContract.isApprovedForAll(account, marketAddress);
          setMarketApproval(approval);
        }
      } else {
        setAccounts([]);
      }
    };
    connectAccounts();
  }, [provider]);

  useEffect(() => {
    if (accounts.length > 0) {
      setCurrentAccount(accounts[0].toLowerCase());
    } else {
      setCurrentAccount(null);
      setMarketApproval(false);
    }
  }, [accounts]);

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

  const context: WalletContextType = {
    connect,
    currentAccount,
    gnftContract,
    marketApproval,
    marketContract,
    provider,
    setMarketApproval,
    walletError
  };

  return <WalletContext.Provider value={context}>{children}</WalletContext.Provider>;
};

export default Wallet;
