import Head from 'next/head';
import { useContext, useEffect, useState } from 'react';
import { Pagination } from 'carbon-components-react';

import { WalletContext } from '../context/Wallet';
import TokenGrid from '../components/TokenGrid';

export default function Market() {
    const { marketContract, connectDefaultProvider, gnftContract, marketAddress } = useContext(WalletContext);
    const [balance, setBalance] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(24);

    const getBalance = async () => {
        const contract = marketContract || connectDefaultProvider().defaultMarketContract;
        const totalUnsold = await contract.getTotalUnsoldItems();
        setBalance(totalUnsold.toNumber());
    }

    useEffect(() => {
        getBalance();
    }, []);

    const handlePaginationChange = e => {
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
            <Pagination className="my-4 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-50" pageSizes={[6, 12, 24, 36]} totalItems={balance} size="lg" onChange={handlePaginationChange} pageSize={24} />
            <TokenGrid page={page} pageSize={pageSize} balance={balance} contract={gnftContract} owner={marketAddress} />
        </div>
    </>;
}