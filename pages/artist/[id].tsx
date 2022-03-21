import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Pagination } from 'carbon-components-react';

import { rpcProvider, prettyAddress } from '../../context/Wallet';
import TokenGrid from '../../components/TokenGrid';
import { GNFT } from '../../types/';

export default function Artist() {
    const [balance, setBalance] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(24);
    const [tokens, setTokens] = useState<GNFT.TokenDataStructOutput[]>([]);
    const [invalidId, setInvalidId] = useState(false);
    const router = useRouter();
    const { id: _id } = router.query;
    const id = _id ? (typeof _id === 'string' ? _id : _id[0]) : '';

    useEffect(() => {
        if (id && !id.match(/^0x[a-fA-F0-9]{40}$/)) {
            setInvalidId(true);
            setBalance(0);
        } else if (id) {
            const getBalance = async () => {
                try {
                    const b = await rpcProvider.tokenContract.createdBalanceOf(id)
                    setBalance(b.toNumber());
                } catch (error) {
                    console.log(error);
                }
            }
            setInvalidId(false);
            getBalance();
        }
    }, [id]);

    useEffect(() => {
        if (balance > 0) {
            const getTokens = async () => {
                try {
                    const t = await rpcProvider.tokenContract.tokensOfCreatorByPage(id, pageSize, page);
                    setTokens(t);
                } catch (error) {
                    console.log(error);
                }
            }
            getTokens();
        }
    }, [balance, page, pageSize]);

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