import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { WalletContext } from '../../context/Wallet';
import axios from 'axios';

export default function Token() {
  const { gnftContract, connectDefaultProvider, prettyAddress, gnftAddress, currentAccount, network } = useContext(WalletContext);
  const [tokenURI, setTokenURI] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [owner, setOwner] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();
  const { id } = router.query;

  const fetchURI = async (tokenId) => {
    setErrorMessage(null);
    const contract = gnftContract || connectDefaultProvider();
    try {
      let totalSupply = await contract.totalSupply();
      totalSupply = totalSupply.toNumber();
      if (tokenId > totalSupply) {
        setRetryCount(retryCount + 1);
      } else {
        const uri = await contract.tokenURI(tokenId);
        const _owner = await contract.ownerOf(tokenId);
        setOwner(_owner);
        setTokenURI(uri);
      }
    } catch (error) {
      setErrorMessage(`Couldn't connect to token ${tokenId}`);
    }
  };

  useEffect(() => {
    if (id) {
      fetchURI(parseInt(id));
    }
  }, [id]);

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
        axios.get(tokenURI).then((data) => setTokenData(data.data));
      }
    };
    fetchData();
  }, [tokenURI]);

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
              <p className="pt-2 text-xs">Artist: {currentAccount && currentAccount === tokenData.artist ? <span className="text-base text-gradient"><span>you</span></span> : prettyAddress(tokenData.artist)}</p>
              <p className="pt-1 pb-2 text-xs">Owner: {currentAccount && currentAccount === owner ? <span className="text-base text-gradient"><span>you</span></span> : prettyAddress(owner)}</p>
              <Image
                className="pt-2"
                src={tokenData.image}
                alt={`${tokenData.name}: ${tokenData.description}`}
                width={500}
                height={500}
              />
              <p className="pt-2 mb-4">{tokenData.description}</p>
            </>
          )}
        </div>
        <div className="max-w-full px-4 text-stone-900 dark:text-stone-50">
          {tokenData && (
            <>
              <h3 className="text-2xl">Source Code</h3>
              <pre className="pt-2" style={{ overflowX: 'scroll' }}>
                <code>{tokenData.sourceCode}</code>
              </pre>
              <h3 className="text-2xl pt-4 pb-2">Token Contract</h3>
              <a
                className="underline overflow-scroll"
                href={network === 'polygon' ? `https://polygonscan.com/address/${gnftAddress}` : `https://mumbai.polygonscan.com/address/${gnftAddress}`}
                target="_blank"
                rel="noreferrer"
              >
                {prettyAddress(gnftAddress)}
              </a>
              <p>Token #{id}</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
