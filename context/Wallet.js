import { createContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { create as ipftHttpClient } from 'ipfs-http-client';

import GNFT from '../artifacts/contracts/GNFT.sol/GNFT.json';
import { gnftAddress } from './config';

export const WalletContext = createContext();

const client = ipftHttpClient({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: `Basic ${process.env.NEXT_PUBLIC_INFURA_IPFS}`,
  },
});

const mumbaiUrl = `https://polygon-mumbai.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`;
const polygonUrl = `https://polygon-mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`;

const Wallet = function ({ children }) {
  const [provider, setProvider] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [walletError, setWalletError] = useState(null);
  const [ipfsUrl, setIpfsUrl] = useState(null);
  const [isMinting, setIsMinting] = useState(false);
  const [gnftContract, setGnftContract] = useState(null);
  const [mintStatus, setMintStatus] = useState('Mint Sketch');

  useEffect(async () => {
    if (provider?.provider) {
      provider.listAccounts().then((a) => {
        setAccounts(a);
      });
      provider.provider.on('accountsChanged', setAccounts);
      provider.provider.on('disconnect', () => {
        setAccounts([]);
      });
      provider.provider.on('chainChanged', (chainId) => {
        chainId !== 80001 && chainId !== '0x13881' ? setWalletError({ chainId }) : setWalletError(null);
        console.log(chainId);
      });
      provider.provider.on('message', console.log);

      const { chainId } = await provider.getNetwork();
      chainId !== 80001 ? setWalletError({ chainId }) : setWalletError(null);
      console.log(chainId);
    }
  }, [provider]);

  useEffect(() => {
    console.log(accounts);
    accounts.length > 0 ? setCurrentAccount(accounts[0]) : setCurrentAccount(null);
  }, [accounts]);

  useEffect(() => {
    console.log(walletError);
  }, [walletError]);

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
          rpc: {
            137: polygonUrl,
            80001: mumbaiUrl,
          },
        },
      },
    };

    const web3Modal = new Web3Modal({ providerOptions });

    try {
      const instance = await web3Modal.connect();
      const eProvider = new ethers.providers.Web3Provider(instance);
      setGnftContract(new ethers.Contract(gnftAddress, GNFT.abi, eProvider));
      setProvider(eProvider);
    } catch (error) {
      console.log(error);
    }
  };

  const connectDefaultProvider = () => {
    const eProvider = new ethers.providers.JsonRpcProvider(mumbaiUrl);
    const contract = new ethers.Contract(gnftAddress, GNFT.abi, eProvider);
    setGnftContract(contract);
    return contract;
  };

  const mint = async () => {
    if (ipfsUrl && gnftContract && currentAccount) {
      setMintStatus('Approve the transaction in your wallet.');
      try {
        const tx = await gnftContract.connect(provider.getSigner()).mintToken(ipfsUrl);
        setMintStatus('Waiting on transaction confirmation.');
        const receipt = await tx.wait();
        const tokenId = receipt.events[0].args[2].toNumber();
        setMintStatus(`Successfully minted GNFT token #${tokenId}`);
        window.location.replace(`/token/${tokenId}`);
      } catch (error) {
        console.log(error);
        setMintStatus('Error minting token.');
        setIpfsUrl(null);
        setIsMinting(false);
        setTimeout(() => {
          setMintStatus('Mint Sketch');
        }, 5000);
      }
      setIpfsUrl(null);
      setIsMinting(false);
      setTimeout(() => {
        setMintStatus('Mint Sketch');
      }, 5000);
    }
  };

  const prettyAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
  };

  return <WalletContext.Provider value={context}>{children}</WalletContext.Provider>;
};

export default Wallet;
