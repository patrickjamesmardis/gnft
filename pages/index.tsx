import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { rpcProvider } from '../context/Wallet';
import { marketAddress } from '../context/config';
import TokenGrid from '../components/TokenGrid';

export default function Home() {
  const [balance, setBalance] = useState(0);
  const [tokens, setTokens] = useState([]);
  const page = 1;
  const pageSize = 6;

  useEffect(() => {
    if (rpcProvider) {
      const getBalance = async () => {
        try {
          const b = await rpcProvider.tokenContract.balanceOf(marketAddress);
          setBalance(b.toNumber());
        } catch (error) {
          console.log(error);
        }
      };
      getBalance();
    }
  }, []);

  useEffect(() => {
    if (balance > 0) {
      const getTokens = async () => {
        try {
          const t = await rpcProvider.tokenContract.tokensOfOwnerByPage(marketAddress, pageSize, page);
          setTokens(t);
        } catch (error) {
          console.log(error);
        }
      };
      getTokens();

    }
  }, [balance]);

  return (
    <>
      <Head>
        <title>GNFT</title>
        <meta name="description" content="Create, mint, and collect generative art NFTs." />
        <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="text-stone-900 dark:text-stone-50 py-4">
        <h1 className="text-3xl text-gradient px-4 pb-24"><span>Create, mint, and collect GNFTs</span></h1>
        <div className="tokensBG">
          <div className="tokensOverlay min-h-[500px] pt-4">

            <h2 className="text-2xl px-4">What is GNFT?</h2>
            <p className="max-w-3xl pt-4 px-4 text-lg">GNFT combines a P5.js playground and NFT marketplace to allow anyone to create, mint, and collect generative art NFTs. NFTs provide a decentralized ledger of transactions to validate authenticity and ownership. GNFTs use the InterPlanetary File System for decentralized file storage to ensure your content is secure and accessible.</p>
            <div className="mt-6 ml-4">
              <Link href="/create"><a className="gradientBG py-3 px-6 text-stone-50 text-left">Create GNFT</a></Link>
              <Link href="/market"><a className="gradientBG-2 py-3 px-6 ml-2 text-stone-50 text-left">Browse GNFTs</a></Link>
            </div>
          </div>
        </div>
        <div className="p-4">
          <h2 className={`text-2xl ${balance > 0 ? 'mb-4' : 'mb-0'}`}>Recent GNFTs</h2>
          {balance > 0 ? <TokenGrid tokens={tokens} /> : <p>0 GNFTs available</p>}
        </div>
      </div>
    </>
  );
}
