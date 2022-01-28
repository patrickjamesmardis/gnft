import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import WalletLink from 'walletlink';

import { createContext, useEffect, useState } from 'react';

export const WalletContext = createContext();

const Wallet = function ({ children }) {
  const [provider, setProvider] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [walletError, setWalletError] = useState(null);

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

  const connect = async () => {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: process.env.NEXT_PUBLIC_INFURA_ID,
          rpc: {
            137: `https://polygon-mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`,
            80001: `https://polygon-mumbai.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`,
          },
        },
      },
      walletlink: {
        package: WalletLink,
        options: {
          appName: 'GNFT',
          infuraId: process.env.NEXT_PUBLIC_INFURA_ID,
        },
      },
    };

    const web3Modal = new Web3Modal({ providerOptions });

    try {
      const instance = await web3Modal.connect();
      const eProvider = new ethers.providers.Web3Provider(instance);
      setProvider(eProvider);
    } catch (error) {
      console.log(error);
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
  };

  return <WalletContext.Provider value={context}>{children}</WalletContext.Provider>;
};

export default Wallet;
