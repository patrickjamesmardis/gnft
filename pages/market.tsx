import Head from 'next/head';
import { useEffect, useState } from 'react';
import { Pagination } from 'carbon-components-react';
import { BigNumber } from 'ethers';
import { rpcProvider } from '../context/Wallet';
import { marketAddress, Token } from '../context/config';
import TokenGrid from '../components/TokenGrid';

export default function Market() {
  const [balance, setBalance] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    if (rpcProvider) {
      rpcProvider.tokenContract
        .balanceOf(marketAddress)
        .then(b => {
          setBalance(b.toNumber());
        })
        .catch(error => console.log(error));
    }
  }, []);

  useEffect(() => {
    if (balance > 0) {
      rpcProvider.tokenContract
        .tokensOfOwnerByPage(marketAddress, pageSize, page)
        .then(ts => {
          Promise.all(
            ts.map(async t => {
              try {
                const item = await rpcProvider.marketContract.getGNFTItem(t.id);
                return {
                  id: t.id,
                  tokenURI: t.tokenURI,
                  owner: t.owner,
                  creator: t.creator,
                  seller: item.seller,
                  itemId: item.itemId,
                  price: item.price,
                };
              } catch (error) {
                console.log(error);
                return {
                  id: t.id,
                  tokenURI: t.tokenURI,
                  owner: t.owner,
                  creator: t.creator,
                  seller: '0x0000000000000000000000000000000000000000',
                  itemId: BigNumber.from(-1),
                  price: BigNumber.from(-1),
                };
              }
            })
          ).then(_tokens => {
            setTokens(_tokens);
          });
        })
        .catch(error => {
          console.log(error);
        });
    }
  }, [balance, page, pageSize]);

  const handlePaginationChange = (e: { page: number; pageSize: number }) => {
    setPage(e.page);
    setPageSize(e.pageSize);
  };

  return (
    <>
      <Head>
        <title>GNFT | Market</title>
        <meta name="description" content="Create, mint, and collect generative art NFTs." />
        <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="p-4 text-stone-900 dark:text-stone-50">
        <h1 className="text-2xl text-gradient">
          <span>GNFT Market</span>
        </h1>
        <p className="text-gradient">
          <span>{`${balance}${balance === 1 ? ' item' : ' items'} available`}</span>
        </p>
        {balance > 0 && (
          <Pagination
            className="my-4 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-50"
            pageSizes={[6, 12, 24, 36]}
            totalItems={balance}
            size="lg"
            onChange={handlePaginationChange}
            pageSize={24}
          />
        )}
        {balance > 0 && <TokenGrid tokens={tokens} />}
      </div>
    </>
  );
}
