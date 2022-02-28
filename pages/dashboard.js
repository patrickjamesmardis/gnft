import Head from 'next/head';
import { useContext, useEffect, useState } from 'react';
import { Pagination } from 'carbon-components-react';

import { WalletContext } from '../context/Wallet';
import CreatorGrid from '../components/CreatorGrid';

export default function Dashboard() {
    const [balance, setBalance] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(24);
    const { currentAccount, prettyAddress, gnftContract, connect } = useContext(WalletContext);

    const getCreatedTokens = async () => {
        const b = await gnftContract.getCreatedBalanceOf(currentAccount);
        setBalance(b.toNumber());
    }

    useEffect(() => {
        if (!currentAccount) {
            connect();
        } else {
            getCreatedTokens();
        }
    }, []);

    useEffect(() => {
        if (currentAccount) {
            getCreatedTokens();
        }
    }, [currentAccount]);

    const handlePaginationChange = e => {
        setPage(e.page)
        setPageSize(e.pageSize);
    };

    return <>
        <Head>
            <title>GNFT | Creator Dashboard</title>
            <meta name="description" content="Create, mint, and collect generative art NFTs." />
            <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="p-4 text-stone-900 dark:text-stone-50">
            <h1 className="text-2xl text-gradient"><span>{currentAccount ? `Creator Dashboard` : `Connect your wallet to view your dashboard.`}</span></h1>
            {currentAccount && <p className="text-gradient"><span>{prettyAddress(currentAccount)}</span></p>}
            {currentAccount && <>
                <Pagination className="my-4 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-50" pageSizes={[6, 12, 24, 36]} totalItems={balance} size="lg" onChange={handlePaginationChange} pageSize={24} />
                <CreatorGrid page={page} pageSize={pageSize} balance={balance} contract={gnftContract} creator={currentAccount} />
            </>}
        </div>
    </>;
}