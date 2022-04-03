import Head from 'next/head';
import Image from 'next/image';
import { Edit16, Share16 } from '@carbon/icons-react';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import {
  CopyButton,
  Pagination,
  SkeletonText,
  Tab,
  Tabs,
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
} from 'carbon-components-react';
import { useContext, useEffect, useState } from 'react';
import { prettyAddress, rpcProvider, WalletContext } from '../context/Wallet';
import { GNFT } from '../types/';
import TokenGrid from '../components/TokenGrid';
import { blockExplorerUrls } from '../context/config';
import { formatEther } from 'ethers/lib/utils';

export default function WalletPage() {
  const {
    account,
    createdBalance,
    collectedBalance,
    maticBalance,
    username,
    setModalOpen,
    transactions,
    updateBalances,
    profileImage,
  } = useContext(WalletContext);
  const [createdPage, setCreatedPage] = useState(1);
  const [ownedPage, setOwnedPage] = useState(1);
  const [createdPageSize, setCreatedPageSize] = useState(24);
  const [ownedPageSize, setOwnedPageSize] = useState(24);
  const [tokens, setTokens] = useState<GNFT.TokenDataStructOutput[]>([]);
  const [shareMessage, setShareMessage] = useState('Share Profile');

  useEffect(() => {
    if (!account) {
      setModalOpen('CONNECT');
    } else {
      updateBalances();
    }
  }, []);

  useEffect(() => {
    if (createdBalance > 0 || collectedBalance > 0) {
      const getTokens = async () => {
        try {
          const created =
            createdBalance < 1
              ? []
              : await rpcProvider.tokenContract.tokensOfCreatorByPage(account, createdPageSize, createdPage);
          const collected =
            collectedBalance < 1
              ? []
              : await rpcProvider.tokenContract.tokensOfOwnerByPage(account, ownedPageSize, ownedPage);
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

  const txTableHeaders = [
    {
      key: 'blockNum',
      header: 'Block',
    },
    {
      key: 'from',
      header: 'From',
    },
    {
      key: 'to',
      header: 'To',
    },
    {
      key: 'details',
      header: 'Details',
    },
    {
      key: 'hash',
      header: 'Hash',
    },
  ];

  const handleShare = () => {
    setShareMessage('Copied Profile URL!');
    navigator.clipboard.writeText(`https://g-nft.app/creator/${username}`);
    setTimeout(() => {
      setShareMessage('Share Profile');
    }, 2000);
  };

  return (
    <>
      <Head>
        <title>GNFT | Wallet</title>
        <meta name="description" content="Create, mint, and collect generative art NFTs." />
        <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="p-4 w-screen text-stone-900 dark:text-stone-50">
        {!account || !username || username === 'LOADING' ? (
          <div className="tokensBG -m-4 w-screen h-[calc(100vh-48px)]">
            <div className="tokensOverlay w-screen h-[calc(100vh-48px)] flex items-center justify-center">
              <div className="flex flex-col gap-4 items-center">
                <Image src="/wallet.svg" alt="Wallet Icon" width={100} height={100} priority />
                <button
                  className={`gradientBG py-3 px-6 text-stone-50 text-left`}
                  onClick={() => {
                    setModalOpen('CONNECT');
                  }}
                  disabled={username === 'LOADING'}
                >
                  {!account
                    ? 'Connect to your GNFT Wallet'
                    : username === 'LOADING'
                    ? 'Loading your GNFT Profile'
                    : 'Setup your GNFT Profile'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-row items-center flex-wrap gap-x-6 gap-y-4">
              <div className="flex flex-row items-center flex-wrap gap-4">
                {profileImage === 'jazz' ? (
                  <Jazzicon diameter={100} seed={jsNumberForAddress(account)} />
                ) : (
                  <Image src={profileImage} width={100} height={100} alt="profile image" className="rounded-full" />
                )}
                <div>
                  <h1 className="text-2xl text-gradient font-bold">
                    <span>@{username}</span>
                  </h1>
                  <div className="flex flex-row items-center flex-nowrap">
                    <h2 className="text-lg text-gradient">
                      <span>{prettyAddress(account)}</span>
                    </h2>
                    <CopyButton
                      onClick={() => {
                        navigator.clipboard.writeText(account);
                      }}
                      iconDescription="Copy Address"
                      feedback="Address Copied!"
                      className="inline-flex"
                    />
                  </div>
                  <div className="flex flex-row items-center flex-wrap gap-x-4 gap-y-1">
                    <button
                      className="inline-flex flex-row items-center hover:bg-stone-200 dark:hover:bg-stone-700"
                      onClick={() => {
                        setModalOpen('EDIT_PROFILE');
                      }}
                    >
                      <Edit16 className="inline mr-2" />
                      Edit Profile
                    </button>
                    <button
                      className="inline-flex flex-row items-center hover:bg-stone-200 dark:hover:bg-stone-700"
                      onClick={handleShare}
                    >
                      <Share16 className="inline mr-2" />
                      {shareMessage}
                    </button>
                  </div>
                </div>
              </div>

              <div className="ml-auto flex flex-col items-end">
                <span className="text-3xl text-stone-400">
                  {collectedBalance === -1 ? (
                    <SkeletonText width="48px" className="inline-block h-[36px] -mb-2 dark:bg-stone-900" />
                  ) : (
                    collectedBalance
                  )}
                  &nbsp;{collectedBalance === 1 ? 'GNFT' : 'GNFTs'} <span className="text-stone-500">|</span>{' '}
                  {maticBalance.eq(-1) ? (
                    <SkeletonText width="144px" className="inline-block h-[36px] -mb-2 dark:bg-stone-900" />
                  ) : (
                    formatEther(maticBalance)
                  )}
                  &nbsp;MATIC
                </span>
                <div className="mt-2 flex flex-row items-center flex-wrap gap-2">
                  <button
                    className="py-3 px-6 text-stone-50 text-left bg-stone-400 dark:bg-stone-600 hover:bg-stone-500"
                    onClick={() => {
                      setModalOpen('RECEIVE');
                    }}
                  >
                    Receive MATIC
                  </button>
                  <button
                    className="py-3 px-6 text-stone-50 text-left bg-stone-400 dark:bg-stone-600 hover:bg-stone-500"
                    onClick={() => {
                      setModalOpen('MATIC');
                    }}
                    disabled={maticBalance.lte(0)}
                  >
                    Transfer MATIC
                  </button>
                </div>
              </div>
            </div>
            <Tabs className="mt-8">
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
                  <TokenGrid tokens={tokens.filter(t => t.owner.toLowerCase() === account.toLowerCase())} />
                </div>
              </Tab>
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
                  <TokenGrid tokens={tokens.filter(t => t.creator.toLowerCase() === account.toLowerCase())} />
                </div>
              </Tab>
              <Tab id="transactions" label={<p className="text-stone-700 dark:text-stone-300">Transactions</p>}>
                <div className="-m-4">
                  <Table>
                    <TableHead>
                      <TableRow>
                        {txTableHeaders.map(header => (
                          <TableHeader key={header.key}>{header.header}</TableHeader>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map(row => (
                        <TableRow key={`${row.hash}-${row.details}`}>
                          {txTableHeaders.map(({ key }) => (
                            <TableCell key={`${key}-${row.hash}`}>
                              {key === 'hash' || key === 'blockNum' ? (
                                <a
                                  className="underline overflow-scroll"
                                  href={`${blockExplorerUrls[0]}/${key === 'hash' ? 'tx' : 'block'}/${row[key]}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {key === 'hash' ? prettyAddress(row[key]) : row[key]}
                                </a>
                              ) : (
                                row[key]
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Tab>
            </Tabs>
          </>
        )}
      </div>
    </>
  );
}
