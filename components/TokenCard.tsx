import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { Button, SkeletonPlaceholder } from 'carbon-components-react';
import { SendAlt16 } from '@carbon/icons-react';
import { marketAddress, Metadata, Token } from '../context/config';
import { prettyAddress, WalletContext } from '../context/Wallet';
import { formatEther } from 'ethers/lib/utils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function TokenCard(props: { token: Token; darkMode: boolean }) {
  const [imageURI, setImageURI] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [description, setDescription] = useState('');
  const { account, setModalOpen, setTransactionToken, setTransactionItem, setTransactionPrice } =
    useContext(WalletContext);
  const [creatorName, setCreatorName] = useState(
    account && account === props.token.creator.toLowerCase() ? 'you' : prettyAddress(props.token.creator)
  );
  const [ownerName, setOwnerName] = useState(
    account && account === props.token.owner.toLowerCase()
      ? 'you'
      : props.token.owner.toLowerCase() === marketAddress
      ? 'GNFT Market'
      : prettyAddress(props.token.owner)
  );

  useEffect(() => {
    axios.get(props.token.tokenURI).then(({ data }: { data: Metadata }) => {
      setImageURI(data.image);
      setDescription(data.description);
    });
    if (creatorName !== 'you') {
      getDoc(doc(db, 'users', props.token.creator.toLowerCase()))
        .then(user => {
          if (user.exists()) {
            setCreatorName(`@${user.data().username}`);
          }
        })
        .catch(error => console.log(error));
    }
    if (ownerName !== 'you' && ownerName !== 'GNFT Market') {
      getDoc(doc(db, 'users', props.token.owner.toLowerCase()))
        .then(user => {
          if (user.exists()) {
            setOwnerName(`@${user.data().username}`);
          }
        })
        .catch(error => console.log(error));
    }
  }, []);

  useEffect(() => {
    if (account) {
      if (account === props.token.owner.toLowerCase()) {
        setOwnerName('you');
      }
      if (account === props.token.creator.toLowerCase()) {
        setCreatorName('you');
      }
    }
  }, [account]);

  const handleTransfer = () => {
    setTransactionToken(props.token.id);
    setModalOpen('GNFT');
  };

  const handleSell = () => {
    setTransactionToken(props.token.id);
    setModalOpen('SELL');
  };

  const handlePurchase = () => {
    setTransactionToken(props.token.id);
    setTransactionItem(props.token.itemId);
    setTransactionPrice(props.token.price);
    setModalOpen('PURCHASE');
  };

  return (
    <div>
      {!imageLoaded && (
        <SkeletonPlaceholder className="absolute dark:bg-stone-800 w-[calc(100vw-32px)] h-[calc(100vw-32px)] xs:w-[calc((100vw-48px)/2)] xs:h-[calc((100vw-48px)/2)] lg:w-[calc((100vw-64px)/3)] lg:h-[calc((100vw-64px)/3)] xl:w-[calc((100vw-80px)/4)] xl:h-[calc((100vw-80px)/4)]" />
      )}
      {imageURI && (
        <Link href={`/token/${props.token.id.toNumber()}`} passHref>
          <a>
            <Image
              src={imageURI}
              width={500}
              height={500}
              sizes="(max-width:479px) calc(100vw-32px), (max-width:1023px) calc((100vw-64px)/2), (max-width:1319px) calc((100vw-64px)/3), (min-width:1320px) calc((100vw-80px)/4)"
              className={`${!imageLoaded && 'hidden'}`}
              onLoadingComplete={() => {
                setImageLoaded(true);
              }}
              alt={description}
            />
          </a>
        </Link>
      )}
      <div
        className={`bg-stone-200 dark:bg-stone-800 p-4 ${
          !imageURI &&
          'pt-[calc(100vw-16px)] xs:pt-[calc(16px+((100vw-32px)/2))] lg:pt-[calc(16px+((100vw-64px)/3))] xl:pt-[calc(16px+((100vw-80px)/4))]'
        }`}
      >
        <div className="flex flex-row justify-between gap-2">
          <div className="flex flex-col justify-between">
            <h3 className="font-black">GNFT #{props.token.id.toString()}</h3>
            <div>
              <p className="text-xs pt-2">
                Creator:{' '}
                <span className={`text-base ${creatorName === 'you' && 'text-gradient'}`}>
                  <span>{creatorName}</span>
                </span>
              </p>
              <p className="text-xs">
                Owner:{' '}
                <span className={`text-base ${ownerName === 'you' && 'text-gradient'}`}>
                  <span>{ownerName}</span>
                </span>
              </p>
            </div>
          </div>

          {props.token.price?.gt(0) && (
            <div className="flex flex-col justify-between">
              <p className="font-black">{formatEther(props.token.price)} MATIC</p>
              {props.token.price?.gt(0) && account && account !== props.token.seller.toLowerCase() && (
                <button className="gradientBG py-3 px-6 text-stone-50 text-left" onClick={handlePurchase}>
                  Buy
                </button>
              )}
            </div>
          )}
          {!props.token.price && (
            <div className="flex flex-col items-center justify-end">
              <Button
                renderIcon={SendAlt16}
                iconDescription="Transfer"
                hasIconOnly
                className={`text-stone-900 hover:text-stone-900 dark:text-stone-50 dark:hover:text-stone-50 hover:bg-stone-300  dark:hover:bg-stone-700 ${
                  account && account.toLowerCase() === props.token.owner.toLowerCase()
                    ? 'opacity-100'
                    : 'opacity-0 cursor-default'
                }`}
                onClick={handleTransfer}
                disabled={!(account && account.toLowerCase() === props.token.owner.toLowerCase())}
              />
              <Button
                renderIcon={() => (
                  <Image
                    src={props.darkMode ? '/market-add-light.svg' : '/market-add-dark.svg'}
                    width={16}
                    height={16}
                    alt="add to market icon"
                  />
                )}
                iconDescription="Sell"
                hasIconOnly
                className={`hidden hover:bg-stone-300 dark:hover:bg-stone-700 ${
                  account && account.toLowerCase() === props.token.owner.toLowerCase()
                    ? 'opacity-100'
                    : 'opacity-0 cursor-default'
                }`}
                onClick={handleSell}
                disabled={!(account && account.toLowerCase() === props.token.owner.toLowerCase())}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
