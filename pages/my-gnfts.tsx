import Head from 'next/head';
import { useContext, useEffect, useState } from 'react';
import { Pagination } from 'carbon-components-react';

import { WalletContext, prettyAddress, rpcProvider } from '../context/Wallet';
import TokenGrid from '../components/TokenGrid';
import { GNFT } from '../types/';

export default function MyGNFTs() {
    const [balance, setBalance] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(24);
    const [tokens, setTokens] = useState<GNFT.TokenDataStructOutput[]>([]);
    const { currentAccount, connect } = useContext(WalletContext);

    useEffect(() => {
        if (!currentAccount) {
            connect();
        } else {
            const getBalance = async () => {
                try {
                    const b = await rpcProvider.tokenContract.balanceOf(currentAccount);
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
                    const t = await rpcProvider.tokenContract.tokensOfOwnerByPage(currentAccount, pageSize, page);
                    setTokens(t);
                } catch (error) {
                    console.log(error);
                }
            };

            getTokens();
        }
    }, [balance, page, pageSize]);

    useEffect(() => {
        if (currentAccount) {
            const getBalance = async () => {
                try {
                    const b = await rpcProvider.tokenContract.balanceOf(currentAccount);
                    setBalance(b.toNumber());
                } catch (error) {
                    console.log(error);
                }
            };
            getBalance();
        } else {
            setBalance(0);
        }
    }, [currentAccount]);

    const handlePaginationChange = (e: { page: number, pageSize: number }) => {
        setPage(e.page)
        setPageSize(e.pageSize);
    };

    return <>
        <Head>
            <title>GNFT | My GNFTs</title>
            <meta name="description" content="Create, mint, and collect generative art NFTs." />
            <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="p-4 text-stone-900 dark:text-stone-50">
            <h1 className="text-2xl text-gradient"><span>{currentAccount ? `${balance}${balance === 1 ? ' GNFT' : ' GNFTs'} collected` : 'Connect your wallet to view your GNFTs.'}</span></h1>
            {currentAccount && <p className="text-gradient"><span>{prettyAddress(currentAccount)}</span></p>}
            {balance > 0 && <Pagination className="my-4 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-50" pageSizes={[6, 12, 24, 36]} totalItems={balance} size="lg" onChange={handlePaginationChange} pageSize={24} />}
            {balance > 0 && <TokenGrid tokens={tokens} />}
        </div>
    </>
}