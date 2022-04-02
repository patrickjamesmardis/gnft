import axios from 'axios';
import { BigNumber, ethers } from 'ethers';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { WalletContext, prettyAddress, rpcProvider } from '../../context/Wallet';
import { gnftAddress, blockExplorerUrls, marketAddress } from '../../context/config';
import CancelModal from '../../components/CancelModal';
import { db } from '../../firebaseConfig';

export default function Token() {
  const { account, modalOpen, setModalOpen, setTransactionToken, setTransactionItem, setTransactionPrice } =
    useContext(WalletContext);
  const [tokenURI, setTokenURI] = useState<string>(null);
  const [tokenData, setTokenData] = useState(null);
  const [owner, setOwner] = useState<string>(null);
  const [ownerName, setOwnerName] = useState<string>(null);
  const [creatorName, setCreatorName] = useState<string>(null);
  const [errorMessage, setErrorMessage] = useState<string>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [seller, setSeller] = useState<string>(null);
  const [price, setPrice] = useState<BigNumber>(null);
  const [itemId, setItemId] = useState<BigNumber>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const router = useRouter();
  const { id: _id } = router.query;
  const id = _id ? (typeof _id === 'string' ? _id : _id[0]) : '';

  const fetchURI = async (tokenId: number) => {
    setErrorMessage(null);
    const contract = rpcProvider.tokenContract;
    try {
      let totalSupply: BigNumber | number = await contract.totalSupply();
      totalSupply = totalSupply.toNumber();
      if (tokenId > totalSupply) {
        setRetryCount(retryCount + 1);
      } else {
        const uri = await contract.tokenURI(tokenId);
        const _owner = await contract.ownerOf(tokenId);
        setOwner(_owner.toLowerCase());
        getDoc(doc(db, 'users', _owner.toLowerCase()))
          .then(user => {
            if (user.exists()) {
              setOwnerName(user.data().username);
            } else {
              setOwnerName(null);
            }
          })
          .catch(error => {
            console.log(error);
            setOwnerName(null);
          });
        setTokenURI(uri);
      }
    } catch (error) {
      setErrorMessage(`Couldn't connect to token ${tokenId}`);
    }
  };

  const fetchMarketItem = async (tokenId: number) => {
    const contract = rpcProvider.marketContract;
    const item = await contract.getGNFTItem(tokenId);
    setSeller(item.seller.toLowerCase());
    setPrice(item.price);
    setItemId(item.itemId);
  };

  useEffect(() => {
    if (id) {
      fetchURI(parseInt(id));
    }
  }, [id, account]);

  useEffect(() => {
    if (!modalOpen && !cancelModalOpen && id) {
      fetchURI(parseInt(id));
    }
  }, [modalOpen, cancelModalOpen]);

  useEffect(() => {
    if (id && retryCount < 10) {
      setTimeout(() => fetchURI(parseInt(id)), 1000);
    } else if (retryCount !== 0) {
      setErrorMessage(`Token ${id} does not exist`);
    }
  }, [retryCount]);

  useEffect(() => {
    const fetchData = async () => {
      if (tokenURI) {
        axios.get(tokenURI).then(data => {
          setTokenData(data.data);
          getDoc(doc(db, 'users', data.data.artist.toLowerCase()))
            .then(user => {
              if (user.exists()) {
                setCreatorName(user.data().username);
              } else {
                setCreatorName(null);
              }
            })
            .catch(error => {
              console.log(error);
              setCreatorName(null);
            });
        });
      }
    };
    fetchData();
  }, [tokenURI]);

  useEffect(() => {
    if (owner === marketAddress) {
      fetchMarketItem(parseInt(id));
    } else {
      setSeller(null);
      setPrice(null);
      setItemId(null);
    }
  }, [owner]);

  return (
    <>
      <Head>
        <title>GNFT Token {id}</title>
        <meta name="description" content="Create, mint, and collect generative art NFTs." />
        <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-wrap pt-4 text-stone-900 dark:text-stone-50" style={{ width: 'calc(100vw - 48px)' }}>
        <div className="px-4">
          <h2 className="text-2xl text-gradient">
            <span>{errorMessage || (tokenData ? tokenData.name : 'Token Data Loading')}</span>
          </h2>
          {tokenData && (
            <>
              <p className="pt-2">{tokenData.description}</p>
              <p className="pt-2 text-xs">
                Creator:{' '}
                {account && tokenData && account.toLowerCase() === tokenData.artist.toLowerCase() ? (
                  <span className="text-base text-gradient">
                    <span>you</span>
                  </span>
                ) : creatorName ? (
                  <Link href={`/creator/${creatorName}`} passHref>
                    <a className="text-base underline">@{creatorName}</a>
                  </Link>
                ) : (
                  <span className="text-base">{prettyAddress(tokenData.artist)}</span>
                )}
              </p>
              <p className="text-xs">
                Owner:{' '}
                {account && account.toLowerCase() === owner ? (
                  <span className="text-base text-gradient">
                    <span>you</span>
                  </span>
                ) : marketAddress === owner ? (
                  <span className="text-base">GNFT Market</span>
                ) : ownerName ? (
                  <Link href={`/creator/${ownerName}`} passHref>
                    <a className="text-base underline">@{ownerName}</a>
                  </Link>
                ) : (
                  <span className="text-base">{prettyAddress(owner)}</span>
                )}
              </p>
              {seller && (
                <p className="text-xs">
                  Seller:{' '}
                  {account && seller === account.toLowerCase() ? (
                    <span className="text-base text-gradient">
                      <span>you</span>
                    </span>
                  ) : (
                    <span className="text-base">{prettyAddress(seller)}</span>
                  )}
                </p>
              )}
              {account && owner && account.toLowerCase() === owner && (
                <div id="ownerActions" className="pt-4">
                  <button
                    className={`gradientBG py-3 px-6 text-stone-50 text-left`}
                    onClick={() => {
                      setTransactionToken(BigNumber.from(id));
                      setModalOpen('SELL');
                    }}
                  >
                    Sell GNFT
                  </button>
                </div>
              )}
              {account && owner === marketAddress && account.toLowerCase() === seller && (
                <div id="cancelActions" className="pt-4 flex items-center">
                  {price && (
                    <h1 className="mr-4 text-gradient text-xl">
                      <span>{ethers.utils.formatEther(price)} MATIC</span>
                    </h1>
                  )}
                  <button
                    className={`gradientBG py-3 px-6 text-stone-50 text-left`}
                    onClick={() => {
                      setCancelModalOpen(true);
                    }}
                  >
                    Cancel Sell
                  </button>
                </div>
              )}
              {account && owner === marketAddress && account.toLowerCase() !== seller && (
                <div id="purchaseActions" className="pt-4 flex items-center">
                  {price && (
                    <h1 className="mr-4 text-gradient text-xl">
                      <span>{ethers.utils.formatEther(price)} MATIC</span>
                    </h1>
                  )}
                  <button
                    className={`gradientBG py-3 px-6 text-stone-50 text-left`}
                    onClick={() => {
                      setTransactionItem(itemId);
                      setTransactionToken(BigNumber.from(id));
                      setTransactionPrice(price);
                      setModalOpen('PURCHASE');
                    }}
                  >
                    Purchase
                  </button>
                </div>
              )}
              {!account && owner === marketAddress && (
                <div id="noUserActions" className="pt-4 flex items-center">
                  {price && (
                    <h1 className="mr-4 text-gradient text-xl">
                      <span>{ethers.utils.formatEther(price)} MATIC</span>
                    </h1>
                  )}
                  <button
                    className={`gradientBG py-3 px-6 text-stone-50 text-left`}
                    onClick={() => {
                      setModalOpen('CONNECT');
                    }}
                  >
                    Connect Wallet
                  </button>
                </div>
              )}

              <div className="mt-4">
                <Image
                  className="pt-2"
                  src={tokenData.image}
                  alt={`${tokenData.name}: ${tokenData.description}`}
                  width={500}
                  height={500}
                />
              </div>
            </>
          )}
        </div>
        <div className="max-w-full px-4 text-stone-900 dark:text-stone-50">
          {tokenData && (
            <>
              <h3 className="text-2xl pb-2">Token Contract</h3>
              <a
                className="underline"
                href={`${blockExplorerUrls[0]}/address/${gnftAddress}`}
                target="_blank"
                rel="noreferrer"
              >
                {prettyAddress(gnftAddress)}
              </a>
              <p>Token #{id}</p>
              <h3 className="text-2xl pt-4">Source Code</h3>
              <pre className="pt-2 text-stone-500 dark:text-stone-400" style={{ overflowX: 'scroll' }}>
                <code>{tokenData.sourceCode}</code>
              </pre>
            </>
          )}
        </div>
      </div>
      {itemId && account && (
        <CancelModal itemId={itemId} tokenId={id} modalOpen={cancelModalOpen} setModalOpen={setCancelModalOpen} />
      )}
    </>
  );
}
