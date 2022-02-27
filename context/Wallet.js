import { useRouter } from 'next/router';
import { createContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import WalletLink from 'walletlink';
import { create as ipftHttpClient } from 'ipfs-http-client';

import GNFT from '../artifacts/contracts/GNFT.sol/GNFT.json';
import { mumbaiAddress, polygonAddress } from './config';

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
const gnftAddress = deployedChainId === 137 ? polygonAddress : mumbaiAddress;

const Wallet = function ({ children }) {
  const [provider, setProvider] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [walletError, setWalletError] = useState(null);
  const [ipfsUrl, setIpfsUrl] = useState(null);
  const [isMinting, setIsMinting] = useState(false);
  const [gnftContract, setGnftContract] = useState(null);
  const [mintStatus, setMintStatus] = useState('Mint Sketch');
  const [mintModalOpen, setMintModalOpen] = useState(false);
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

  useEffect(() => {
    accounts.length > 0 ? setCurrentAccount(accounts[0]) : setCurrentAccount(null);
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
      setProvider(eProvider);
    } catch (error) {
      console.log(error);
      setWalletError(error);
    }
  };

  const connectDefaultProvider = () => {
    const eProvider = new ethers.providers.JsonRpcProvider(rpc);
    const contract = new ethers.Contract(gnftAddress, GNFT.abi, eProvider);
    setGnftContract(contract);
    return contract;
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

  const prettyAddress = (address) => {
    return address.match(/^0x[a-fA-F0-9]{40}$/) ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
  };

  const context = {
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
    gnftContract,
    connectDefaultProvider,
    gnftAddress,
    wrongNetwork,
    mintModalOpen,
    setMintModalOpen,
    network
  };

  return <WalletContext.Provider value={context}>{children}</WalletContext.Provider>;
};

export default Wallet;
