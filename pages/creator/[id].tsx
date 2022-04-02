import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Pagination, Tab, Tabs } from 'carbon-components-react';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { rpcProvider, prettyAddress } from '../../context/Wallet';
import TokenGrid from '../../components/TokenGrid';
import { GNFT } from '../../types/';
import { db } from '../../firebaseConfig';

const usersRef = collection(db, 'users');

export default function Artist() {
  const [createdBalance, setCreatedBalance] = useState(0);
  const [collectedBalance, setCollectedBalance] = useState(0);
  const [createdPage, setCreatedPage] = useState(1);
  const [ownedPage, setOwnedPage] = useState(1);
  const [createdPageSize, setCreatedPageSize] = useState(24);
  const [ownedPageSize, setOwnedPageSize] = useState(24);
  const [tokens, setTokens] = useState<GNFT.TokenDataStructOutput[]>([]);
  const [invalidId, setInvalidId] = useState(false);
  const [address, setAddress] = useState('');
  const [image, setImage] = useState('jazz');
  const router = useRouter();
  const { id: _id } = router.query;
  const id = _id ? (typeof _id === 'string' ? _id : _id[0]) : '';

  useEffect(() => {
    if (id) {
      const getBalance = async (address: string) => {
        try {
          rpcProvider.tokenContract.createdBalanceOf(address).then(b => setCreatedBalance(b.toNumber()));
          rpcProvider.tokenContract.balanceOf(address).then(b => setCollectedBalance(b.toNumber()));
        } catch (error) {
          console.log(error);
        }
      };
      getDocs(query(usersRef, where('username', '==', id.toLowerCase())))
        .then(q => {
          if (q.empty) {
            setInvalidId(true);
          } else {
            const data = q.docs[0].data();
            setAddress(q.docs[0].id);
            getBalance(q.docs[0].id);
            setImage(data.image || 'jazz');
            setInvalidId(false);
          }
        })
        .catch(error => {
          console.log(error);
          setInvalidId(true);
        });
    }
  }, [id]);

  useEffect(() => {
    if (createdBalance > 0 || collectedBalance > 0) {
      const getTokens = async () => {
        try {
          const created =
            createdBalance < 1
              ? []
              : await rpcProvider.tokenContract.tokensOfCreatorByPage(address, createdPageSize, createdPage);
          const collected =
            collectedBalance < 1
              ? []
              : await rpcProvider.tokenContract.tokensOfOwnerByPage(address, ownedPageSize, ownedPage);
          const tokens = [...created, ...collected].reduce<{ [key: number]: GNFT.TokenDataStructOutput }>(
            (acc, t) => ({ ...acc, [t.id.toNumber()]: t }),
            {}
          );
          setTokens(Object.values(tokens));
        } catch (error) {
          console.log(error);
        }
      };
      getTokens();
    }
  }, [createdBalance, collectedBalance, createdPage, createdPageSize, ownedPage, ownedPageSize]);

  const handleCreatedPaginationChange = (e: { page: number; pageSize: number }) => {
    setCreatedPage(e.page);
    setCreatedPageSize(e.pageSize);
  };

  const handleOwnedPaginationChange = (e: { page: number; pageSize: number }) => {
    setOwnedPage(e.page);
    setOwnedPageSize(e.pageSize);
  };

  return (
    <>
      <Head>
        <title>GNFT | @{id}</title>
        <meta name="description" content="Create, mint, and collect generative art NFTs." />
        <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {!invalidId && (
        <div className="p-4 w-screen text-stone-900 dark:text-stone-50">
          <div className="flex flex-row items-center flex-wrap gap-4">
            {image === 'jazz' ? (
              <Jazzicon diameter={100} seed={jsNumberForAddress(address)} />
            ) : (
              <Image src={image} width={100} height={100} className="rounded-full" alt="user profile image" />
            )}
            <div>
              <h1 className="text-2xl text-gradient font-bold">
                <span>@{id}</span>
              </h1>
              <div className="flex flex-row items-center flex-nowrap">
                <h2 className="text-lg text-gradient">
                  <span>{address && prettyAddress(address)}</span>
                </h2>
              </div>
            </div>
          </div>

          <Tabs className="mt-8">
            <Tab
              id="created"
              label={
                <p className="text-stone-700 dark:text-stone-300">
                  Created{createdBalance !== -1 && <>&nbsp;&nbsp;&nbsp;[{createdBalance}]</>}
                </p>
              }
            >
              <div className="-m-4">
                <Pagination
                  className="mb-4 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-50"
                  pageSizes={[6, 12, 24, 36]}
                  totalItems={createdBalance}
                  size="lg"
                  onChange={handleCreatedPaginationChange}
                  pageSize={24}
                />
                <TokenGrid tokens={tokens.filter(t => t.creator.toLowerCase() === address.toLowerCase())} />
              </div>
            </Tab>
            <Tab
              id="collected"
              label={
                <p className="text-stone-700 dark:text-stone-300">
                  Collected{collectedBalance !== -1 && <>&nbsp;&nbsp;&nbsp;[{collectedBalance}]</>}
                </p>
              }
            >
              <div className="-m-4">
                <Pagination
                  className="mb-4 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-50"
                  pageSizes={[6, 12, 24, 36]}
                  totalItems={createdBalance}
                  size="lg"
                  onChange={handleOwnedPaginationChange}
                  pageSize={24}
                />
                <TokenGrid tokens={tokens.filter(t => t.owner.toLowerCase() === address.toLowerCase())} />
              </div>
            </Tab>
          </Tabs>
        </div>
      )}
    </>
  );
}
