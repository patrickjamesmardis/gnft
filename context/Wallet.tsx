import { createContext, Dispatch, SetStateAction, useEffect, useState } from 'react';
import axios from 'axios';
import { Magic, MagicUserMetadata } from 'magic-sdk';
import { ethers, BigNumber } from 'ethers';
import { hexZeroPad, hexStripZeros } from 'ethers/lib/utils';
import { doc, getDoc } from 'firebase/firestore';
import { GNFT, GNFTMarket, GNFTMarket__factory, GNFT__factory } from '../types';
import { gnftAddress, marketAddress, rpc, deployedChainId, Transaction } from './config';
import { db } from '../firebaseConfig';

type WalletContext = {
  account: string;
  clearLoginError: () => void;
  collectedBalance: number;
  createdBalance: number;
  generateMagicToken: () => Promise<string>;
  login: (phoneNumber: string) => void;
  logout: () => void;
  maticBalance: BigNumber;
  magicUserMeta: MagicUserMetadata | 'INIT_LOAD' | 'LOADING' | 'ERROR';
  marketApproval: boolean;
  marketContract: GNFTMarket;
  modalOpen: 'CONNECT' | 'GNFT' | 'MATIC' | 'RECEIVE' | 'SELL' | 'PURCHASE' | false;
  provider: ethers.providers.Web3Provider;
  setMarketApproval: Dispatch<SetStateAction<boolean>>;
  setModalOpen: Dispatch<SetStateAction<WalletContext['modalOpen']>>;
  setTransactionItem: Dispatch<SetStateAction<WalletContext['transactionItem']>>;
  setTransactionToken: Dispatch<SetStateAction<WalletContext['transactionToken']>>;
  setTransactionPrice: Dispatch<SetStateAction<WalletContext['transactionPrice']>>;
  setUsername: Dispatch<SetStateAction<string>>;
  tokenContract: GNFT;
  transactions: Transaction[];
  transactionItem: BigNumber;
  transactionPrice: BigNumber;
  transactionToken: BigNumber;
  updateBalances: () => void;
  username: string;
};

export const WalletContext = createContext<WalletContext>(null);

export const connectDefaultProvider = () => {
  const provider = new ethers.providers.JsonRpcProvider(rpc);
  const tokenContract = new ethers.Contract(gnftAddress, GNFT__factory.createInterface(), provider) as GNFT;
  const tokenFunctions = Object.keys(tokenContract.filters).reduce<{ [key: string]: string }>(
    (acc, key) => ({ ...acc, [tokenContract.interface.getEventTopic(key)]: key }),
    {}
  );
  const marketContract = new ethers.Contract(
    marketAddress,
    GNFTMarket__factory.createInterface(),
    provider
  ) as GNFTMarket;
  const marketFunctions = Object.keys(marketContract.filters).reduce<{ [key: string]: string }>(
    (acc, key) => ({ ...acc, [marketContract.interface.getEventTopic(key)]: key }),
    {}
  );
  return { tokenContract, tokenFunctions, marketContract, marketFunctions, provider };
};

export const rpcProvider = connectDefaultProvider();

export const prettyAddress = (address: string) => {
  return address.match(/^0x[a-fA-F0-9]{10,}$/)
    ? `${address.slice(0, 6)}...${address.slice(-4)}`.toLowerCase()
    : address;
};

const network = {
  rpcUrl: rpc,
  chainId: deployedChainId,
};

const Wallet = function ({ children }) {
  const [account, setAccount] = useState<string>(null);
  const [username, setUsername] = useState<string>(null);
  const [magicUserMeta, setMagicUserMeta] = useState<WalletContext['magicUserMeta']>('INIT_LOAD');
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>(null);
  const [tokenContract, setTokenContract] = useState<GNFT>(null);
  const [marketContract, setMarketContract] = useState<GNFTMarket>(null);
  const [magic, setMagic] = useState<Magic>(null);
  const [marketApproval, setMarketApproval] = useState(false);
  const [createdBalance, setCreatedBalance] = useState(-1);
  const [collectedBalance, setCollectedBalance] = useState(-1);
  const [maticBalance, setMaticBalance] = useState<BigNumber>(BigNumber.from(-1));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalOpen, setModalOpen] = useState<WalletContext['modalOpen']>(false);
  const [transactionToken, setTransactionToken] = useState<WalletContext['transactionToken']>(BigNumber.from(0));
  const [transactionItem, setTransactionItem] = useState<WalletContext['transactionItem']>(BigNumber.from(0));
  const [transactionPrice, setTransactionPrice] = useState<WalletContext['transactionPrice']>(BigNumber.from(0));

  const setupProvider = (m: Magic) => {
    const _provider = new ethers.providers.Web3Provider(m.rpcProvider);
    setProvider(_provider);
    setTokenContract(new ethers.Contract(gnftAddress, GNFT__factory.createInterface(), _provider) as GNFT);
    setMarketContract(
      new ethers.Contract(marketAddress, GNFTMarket__factory.createInterface(), _provider) as GNFTMarket
    );
  };

  useEffect(() => {
    const _magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY, { network });
    setMagic(_magic);
    _magic.user.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        setUsername('LOADING');
        _magic.user.getMetadata().then(m => {
          setMagicUserMeta(m);
          setAccount(m.publicAddress.toLowerCase());
        });
        setupProvider(_magic);
      } else {
        setMagicUserMeta(null);
        setUsername(null);
      }
    });
  }, []);

  const parseData = (txs: any[], type: 'from' | 'to'): Transaction[] =>
    txs.map(tx => ({
      blockNum: parseInt(tx.blockNumber.slice(2), 16),
      from:
        type === 'from'
          ? 'you'
          : parseInt(tx.topics[1].slice(2), 16) === 0
          ? '0x0'
          : hexStripZeros(tx.topics[1]).toLowerCase() === marketAddress
          ? 'GNFT Market'
          : prettyAddress(hexStripZeros(tx.topics[1])),
      to:
        type === 'to'
          ? 'you'
          : parseInt(tx.topics[2].slice(2), 16) === 0
          ? '0x0'
          : hexStripZeros(tx.topics[2]).toLowerCase() === marketAddress
          ? 'GNFT Market'
          : prettyAddress(hexStripZeros(tx.topics[2])),
      details: rpcProvider.tokenFunctions[tx.topics[0]],
      hash: tx.transactionHash,
    }));

  const updateBalances = () => {
    try {
      rpcProvider.provider.getBalance(account).then(matic => setMaticBalance(matic));
      rpcProvider.tokenContract.createdBalanceOf(account).then(created => setCreatedBalance(created.toNumber()));
      rpcProvider.tokenContract.balanceOf(account).then(owned => setCollectedBalance(owned.toNumber()));
    } catch (error) {
      console.log(error);
    }
  };

  const getTransactions = () =>
    rpcProvider.provider.getBlockNumber().then(blockNumber => {
      const getConfig = (toFrom: 'to' | 'from'): any => {
        const data = JSON.stringify({
          jsonrpc: '2.0',
          id: 0,
          method: 'eth_getLogs',
          params: [
            {
              fromBlock: '0x0',
              toBlock: `0x${blockNumber.toString(16)}`,
              address: gnftAddress,
              topics: toFrom === 'from' ? [null, hexZeroPad(account, 32)] : [null, null, hexZeroPad(account, 32)],
            },
          ],
        });
        return {
          method: 'post',
          url: rpc,
          headers: {
            'Content-Type': 'application/json',
          },
          data,
        };
      };

      axios(getConfig('to'))
        .then(toRes => {
          axios(getConfig('from'))
            .then(fromRes => {
              const to = parseData(toRes.data.result, 'to');
              const from = parseData(fromRes.data.result, 'from');

              const merged = [...to, ...from];
              merged.sort((a, b) => b.blockNum - a.blockNum);
              setTransactions(merged);
            })
            .catch(error => {
              console.log(error);
            });
        })
        .catch(error => {
          console.log(error);
        });
    });

  useEffect(() => {
    if (account) {
      getDoc(doc(db, 'users', account))
        .then(doc => {
          if (doc.exists()) {
            const data = doc.data();
            if (data.username) {
              setUsername(data.username);
            } else {
              setUsername(null);
            }
          } else {
            setUsername(null);
          }
        })
        .catch(error => {
          console.log(error);
          setUsername('ERROR');
        });
      rpcProvider.tokenContract.isApprovedForAll(account, marketAddress).then(setMarketApproval);
      updateBalances();
      getTransactions();
    }
  }, [account]);

  const login = (phoneNumber: string) => {
    setMagicUserMeta('LOADING');
    setUsername('LOADING');
    magic.auth
      .loginWithSMS({ phoneNumber })
      .then(() => {
        magic.user.getMetadata().then(m => {
          setMagicUserMeta(m);
          setAccount(m.publicAddress.toLowerCase());
        });
        setupProvider(magic);
      })
      .catch(error => {
        console.log(error);
        setMagicUserMeta('ERROR');
      });
  };

  const logout = () => {
    magic.user.logout().then(() => {
      setAccount(null);
      setMagicUserMeta(null);
      setUsername(null);
      setProvider(null);
      setTokenContract(null);
      setMarketContract(null);
      setMarketApproval(false);
      setCreatedBalance(-1);
      setCollectedBalance(-1);
      setMaticBalance(BigNumber.from(-1));
    });
  };

  const clearLoginError = () => {
    if (magicUserMeta === 'ERROR') {
      setMagicUserMeta(null);
    }
  };

  const generateMagicToken = async () => {
    try {
      const id = await magic.user.generateIdToken();
      return id;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  const context: WalletContext = {
    account,
    login,
    logout,
    tokenContract,
    createdBalance,
    collectedBalance,
    clearLoginError,
    maticBalance,
    magicUserMeta,
    marketApproval,
    marketContract,
    provider,
    setMarketApproval,
    setUsername,
    username,
    transactions,
    modalOpen,
    setModalOpen,
    updateBalances,
    transactionToken,
    setTransactionToken,
    transactionItem,
    setTransactionItem,
    transactionPrice,
    setTransactionPrice,
    generateMagicToken,
  };

  return <WalletContext.Provider value={context}>{children}</WalletContext.Provider>;
};

export default Wallet;
