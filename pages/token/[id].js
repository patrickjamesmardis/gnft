import Head from 'next/head';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
// import ethers from 'ethers';
import { WalletContext } from '../../context/Wallet';
import { gnftAddress } from '../../context/config';
import axios from 'axios';

export default function Token() {
  const { gnftContract, connectDefaultProvider, getTokenUri } = useContext(WalletContext);
  const [tokenURI, setTokenURI] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(async () => {
    if (id) {
      if (!gnftContract) {
        console.log(id);
        const contract = connectDefaultProvider();
        const uri = await contract.tokenURI(id);
        setTokenURI(uri);
      } else {
        const uri = await gnftContract.tokenURI(id);
        setTokenURI(uri);
      }
    }
  }, [id]);

  useEffect(async () => {
    if (tokenURI) {
      axios.get(tokenURI).then((data) => setTokenData(data.data));
    }
  }, [tokenURI]);

  useEffect(() => {
    if (tokenData) {
      console.log(tokenData);
    }
  }, [tokenData]);

  return (
    <>
      <Head>
        <title>GNFT Token {id}</title>
        <meta name="description" content="Create, mint, and collect generative art NFTs." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-wrap pt-4" style={{ width: 'calc(100vw - 48px)' }}>
        <div className="pl-4">
          <h2 className="text-2xl text-gradient">
            <span>{tokenData ? tokenData.name : 'Token Data Loading'}</span>
          </h2>
          {tokenData && (
            <>
              <p className="pt-2">Artist: {tokenData.artist}</p>
              <img className="pt-2" src={tokenData.image} alt={`${tokenData.name}: ${tokenData.description}`} />
              <p className="pt-2">{tokenData.description}</p>
            </>
          )}
        </div>
        <div className="max-w-full pl-4">
          {tokenData && (
            <>
              <h3 className="text-2xl">Source Code</h3>
              <pre className="pt-2" style={{ overflowX: 'scroll' }}>
                <code>{tokenData.sourceCode}</code>
              </pre>
              <h3 className="text-2xl pt-4 pb-2">Token Contract</h3>
              <a className="underline" href={`https://mumbai.polygonscan.com/address/${gnftAddress}`} target="_blank">
                {gnftAddress}
              </a>
              <p>Token #{id}</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
