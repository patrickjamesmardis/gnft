import Head from 'next/head';
import { useEffect, useState } from 'react';
import { Pagination } from 'carbon-components-react';

import { rpcProvider } from '../context/Wallet';
import { marketAddress } from '../context/config';
import { GNFT } from '../types/';
import TokenGrid from '../components/TokenGrid';

export default function Market() {
    const [balance, setBalance] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(24);
    const [tokens, setTokens] = useState<GNFT.TokenDataStructOutput[]>([]);

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
    }, [balance, page, pageSize]);

    const handlePaginationChange = (e: { page: number, pageSize: number }) => {
        setPage(e.page)
        setPageSize(e.pageSize);
    };

    return <>
        <Head>
            <title>GNFT | Market</title>
            <meta name="description" content="Create, mint, and collect generative art NFTs." />
            <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="p-4 text-stone-900 dark:text-stone-50">
            <h1 className="text-2xl text-gradient"><span>GNFT Market</span></h1>
            <p className="text-gradient"><span>{`${balance}${balance === 1 ? ' item' : ' items'} available`}</span></p>
            {balance > 0 && <Pagination className="my-4 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-50" pageSizes={[6, 12, 24, 36]} totalItems={balance} size="lg" onChange={handlePaginationChange} pageSize={24} />}
            {balance > 0 && <TokenGrid tokens={tokens} />}
        </div>
    </>;
}