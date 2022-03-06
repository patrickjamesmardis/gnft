import Head from 'next/head';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { Pagination } from 'carbon-components-react';

import { WalletContext } from '../../context/Wallet';
import TokenGrid from '../../components/TokenGrid';

export default function Artist() {
    const [balance, setBalance] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(24);
    const [tokens, setTokens] = useState([]);
    const [invalidId, setInvalidId] = useState(false);
    const { rpcProvider, prettyAddress } = useContext(WalletContext);
    const router = useRouter();
    const { id } = router.query;

    const getBalance = async () => {
        if (!invalidId) {
            const b = await rpcProvider.tokenContract.createdBalanceOf(id);
            setBalance(b.toNumber());
        }
    };

    const getTokens = async () => {
        if (balance > 0 && !invalidId) {
            const t = await rpcProvider.tokenContract.tokensOfCreatorByPage(id, pageSize, page);
            setTokens(t);
        }
    }

    useEffect(() => {
        if (id && !id.match(/^0x[a-fA-F0-9]{40}$/)) {
            setInvalidId(true);
            setBalance(0);
        } else if (rpcProvider && id) {
            setInvalidId(false);
            getBalance();
        }
    }, [rpcProvider, id]);

    useEffect(() => {
        if (balance > 0) {
            getTokens();
        }
    }, [balance]);

    useEffect(() => {
        getTokens();
    }, [page, pageSize]);

    const handlePaginationChange = e => {
        setPage(e.page);
        setPageSize(e.pageSize);
    }

    return <>
        <Head>
            <title>GNFT | Artist {id && !invalidId && prettyAddress(id)}</title>
            <meta name="description" content="Create, mint, and collect generative art NFTs." />
            <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="p-4 text-stone-900 dark:text-stone-50">
            <h1 className="text-2xl text-gradient"><span>{invalidId ? `${id} is not a vaild artist` : `Artist ${id && prettyAddress(id)}`}</span></h1>
            {!invalidId && <p className="text-gradient"><span>{`${balance}${balance === 1 ? ' GNFT' : ' GNFTs'} created`}</span></p>}
            {!invalidId && balance > 0 && <Pagination className="my-4 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-50" pageSizes={[6, 12, 24, 36]} totalItems={balance} size="lg" onChange={handlePaginationChange} pageSize={24} />}
            {balance > 0 && <TokenGrid tokens={tokens} />}
        </div>
    </>;
}