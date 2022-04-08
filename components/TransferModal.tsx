import { ChangeEvent, useContext, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import {
  Button,
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  SkeletonText,
  TextInput,
  NumberInput,
} from 'carbon-components-react';
import { BigNumber } from 'ethers';
import { formatEther, parseEther, parseUnits } from 'ethers/lib/utils';
import { collection, query, where, doc, getDoc, getDocs, orderBy, limit } from 'firebase/firestore';

import { db } from '../firebaseConfig';
import { prettyAddress, WalletContext } from '../context/Wallet';
import { gasStation, GasStationData, networkName } from '../context/config';

const usersRef = collection(db, 'users');

type UserData = {
  id: string;
  username: string;
  image: string;
};

const MiniProfile = ({ user }: { user: UserData }) => (
  <div className="flex flex-row gap-4 items-center">
    {user.image === 'jazz' ? (
      <Jazzicon diameter={48} seed={jsNumberForAddress(user.id)} />
    ) : (
      <Image src={user.image} width={48} height={48} className="rounded-full" alt="user profile image" />
    )}
    <div className="flex flex-col gap-1">
      {user.username && <p>@{user.username}</p>}
      <p>{prettyAddress(user.id)}</p>
    </div>
  </div>
);

export default function TransferModal() {
  const {
    account,
    username,
    provider,
    tokenContract,
    modalOpen,
    setModalOpen,
    transactionToken,
    setTransactionToken,
    maticBalance,
    updateBalances,
    profileImage,
  } = useContext(WalletContext);
  const [status, setStatus] = useState<'SELECT_TO' | 'SET_VALUE' | 'SIGN_TX' | 'WAITING' | 'SUCCESS' | 'ERROR'>(
    'SELECT_TO'
  );
  const [inputWarn, setInputWarn] = useState('');
  const [toUser, setToUser] = useState<UserData>(null);
  const [matchedUsers, setMatchedUsers] = useState<UserData[]>([]);
  const [gas, setGas] = useState<BigNumber>(BigNumber.from(-1));
  const [value, setValue] = useState<BigNumber>(undefined);
  const [gasTimeout, setGasTimeout] = useState(null);
  const userRef = useRef(null);
  const valueRef = useRef(null);

  const updateGas = () => {
    setGas(BigNumber.from(-1));
    axios
      .get(gasStation)
      .then(({ data }: { data: GasStationData }) => {
        const gasPrice = parseUnits(data.standard.maxFee.toFixed(9), 'gwei');
        if (modalOpen === 'GNFT') {
          tokenContract
            .connect(provider.getSigner())
            .estimateGas.transferFrom(account, toUser.id, transactionToken)
            .then(gas => {
              setGas(gasPrice.mul(gas));
              setGasTimeout(setTimeout(updateGas, 30000));
            })
            .catch(error => {
              console.log(error);
              setGas(BigNumber.from(-2));
            });
        } else {
          provider
            .getSigner()
            .estimateGas({ to: toUser.id, value: value })
            .then(gas => {
              setGas(gasPrice.mul(gas));
              setGasTimeout(setTimeout(updateGas, 30000));
            })
            .catch(error => {
              console.log(error);
              setGas(BigNumber.from(-2));
            });
        }
      })
      .catch(error => {
        console.log(error);
        setGas(BigNumber.from(-3));
      });
  };

  useEffect(() => {
    if (modalOpen === 'GNFT') {
      setValue(BigNumber.from(0));
    }
  }, [modalOpen]);

  useEffect(() => {
    if (modalOpen === 'GNFT' || modalOpen === 'MATIC') {
      if (status === 'SELECT_TO' && userRef.current) {
        userRef.current.focus();
      } else if (status === 'SET_VALUE' && valueRef.current) {
        valueRef.current.focus();
      }
    }
  }, [modalOpen, status]);

  useEffect(() => {
    if (status === 'SIGN_TX' && toUser) {
      updateGas();
    }
  }, [status, toUser]);

  useEffect(() => {
    if (status !== 'SIGN_TX' && gasTimeout) {
      clearTimeout(gasTimeout);
    }
  }, [status, gasTimeout]);

  const handleToChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const v = value.toLowerCase();
    if (!v.match(/^@|^0x/)) {
      setInputWarn('Invalid username or address (@... or 0x...)');
    } else if (v.match(/^@/)) {
      if (!v.match(/^@[a-zA-Z0-9_]{3,20}$/)) {
        setInputWarn("This doesn't look like a username");
      } else if (v.slice(1) === username) {
        setInputWarn("You can't transfer to yourself");
      } else {
        getDocs(
          query(
            usersRef,
            orderBy('username'),
            where('username', '>=', v.slice(1)),
            where('username', '<=', v.slice(1) + '\uf8ff'),
            limit(5)
          )
        )
          .then(q => {
            if (q.empty) {
              setInputWarn(`No users found matching ${v}...`);
              setMatchedUsers([]);
            } else {
              const users = q.docs.map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  username: data.username,
                  image: data.image || 'jazz',
                };
              });
              setMatchedUsers(users);
              setInputWarn('');
            }
          })
          .catch(error => {
            console.log(error);
            setInputWarn("Couldn't fetch users");
          });
      }
    } else if (v.match(/^0x/)) {
      if (!v.match(/^0x[0-9a-fA-F]{40}$/)) {
        setInputWarn("This doesn't look like an address");
      } else if (v === account) {
        setInputWarn("You can't transfer to yourself");
      } else {
        getDoc(doc(db, 'users', v))
          .then(doc => {
            if (doc.exists()) {
              const data = doc.data();
              setMatchedUsers([{ id: v, username: data.username || '', image: data.image || 'jazz' }]);
            } else {
              setMatchedUsers([{ id: v, username: '', image: 'jazz' }]);
            }
          })
          .catch(error => {
            console.log(error);
            setMatchedUsers([{ id: v, username: '', image: 'jazz' }]);
          });
        setInputWarn('');
      }
    }
  };

  const handleClose = () => {
    if (modalOpen === 'GNFT') {
      setTransactionToken(BigNumber.from(0));
    }
    setModalOpen(false);
    setStatus('SELECT_TO');
    setInputWarn('');
    setToUser(null);
    setMatchedUsers([]);
    setGas(BigNumber.from(-1));
    setValue(undefined);
  };

  const handleSelectTo = (user: UserData) => {
    setToUser(user);
    if (modalOpen === 'GNFT') {
      setStatus('SIGN_TX');
    } else {
      setStatus('SET_VALUE');
    }
  };

  const handleSubmit = () => {
    if (status === 'SET_VALUE') {
      setStatus('SIGN_TX');
    } else if (status === 'SIGN_TX') {
      setStatus('WAITING');
      if (modalOpen === 'GNFT') {
        tokenContract
          .connect(provider.getSigner())
          .transferFrom(account, toUser.id, transactionToken)
          .then(tx => {
            tx.wait()
              .then(() => {
                setStatus('SUCCESS');
                updateBalances();
              })
              .catch(error => {
                console.log(error);
                setStatus('ERROR');
              });
          })
          .catch(error => {
            console.log(error);
            setStatus('ERROR');
          });
      } else if (modalOpen === 'MATIC') {
      }
    }
  };

  const handleValueChange = (_: any, update: { value: string; direction: string } | string) => {
    let _value: BigNumber;
    if (typeof update === 'object') {
      if (update.value === '') {
        _value = undefined;
        setValue(_value);
      } else {
        _value = parseEther(update.value);
        setValue(_value);
      }
    } else {
      if (_value) {
        if (update === 'up') {
          if (_value) {
            _value = value.add(parseEther('1'));
            setValue(_value);
          }
        } else if (update === 'down') {
          _value = value.sub(parseEther('1'));
          setValue(_value);
        }
      } else {
        _value = BigNumber.from(1);
        setValue(_value);
      }
    }

    if (!_value) {
      setInputWarn('Please enter a value to transfer');
    } else if (_value.lte(0)) {
      setInputWarn('Value must be greater than 0');
    } else if (_value.gte(maticBalance)) {
      setInputWarn(`Insufficient funds. Balance: ${formatEther(maticBalance)} MATIC`);
    } else {
      setInputWarn('');
    }
  };

  return (
    <ComposedModal
      open={modalOpen === 'GNFT' || modalOpen === 'MATIC'}
      onClose={handleClose}
      preventCloseOnClickOutside={status === 'WAITING'}
    >
      <ModalHeader label="GNFT Wallet" closeIconClassName={status === 'WAITING' ? 'hidden' : 'visible'}>
        <h1>
          Transfer {modalOpen}
          {modalOpen === 'GNFT' && ` #${transactionToken.toString()}`}
        </h1>
      </ModalHeader>
      <ModalBody>
        <div className="flex flex-col items-center mb-4">
          <div className={status === 'WAITING' ? 'spinner' : undefined}></div>
          <Image
            src="/wallet.svg"
            alt="Wallet Icon"
            width={status === 'WAITING' ? 50 : 100}
            height={status === 'WAITING' ? 50 : 100}
            className={status === 'ERROR' ? 'opacity-30' : 'opacity-100'}
            priority
          />
          {account && <p style={{ paddingRight: 0 }}>{prettyAddress(account)}</p>}
          {maticBalance.gte(0) && <p style={{ paddingRight: 0 }}>{formatEther(maticBalance)} MATIC</p>}
        </div>
        {toUser && (
          <div className="flex flex-row gap-4 justify-center">
            <div>
              <p className="mb-2 ml-16">From</p>
              <MiniProfile user={{ id: account, username, image: profileImage }} />
            </div>
            <div>
              <p className="mb-2 ml-16">To</p>
              <MiniProfile user={toUser} />
            </div>
          </div>
        )}
        {status === 'SELECT_TO' ? (
          <>
            <TextInput
              data-modal-primary-focus
              ref={userRef}
              id="toSearch"
              labelText="Search for recipient"
              placeholder="@... or 0x..."
              onChange={handleToChange}
              invalid={!!inputWarn}
              invalidText={inputWarn}
              pattern="^[0-9.]{1,}$"
            />
            {!inputWarn && matchedUsers.length > 0 && (
              <>
                <p className="pt-4 pb-2">
                  Select an account to receive {modalOpen}
                  {modalOpen === 'GNFT' && ` #${transactionToken.toString()}`}
                </p>
                <div className="flex flex-col">
                  {matchedUsers.map(user => (
                    <button
                      key={user.id}
                      className="py-3 px-4 text-stone-50 text-left bg-stone-400 hover:bg-stone-500"
                      onClick={() => {
                        handleSelectTo(user);
                      }}
                    >
                      <MiniProfile user={user} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        ) : status === 'SET_VALUE' ? (
          <>
            <NumberInput
              ref={valueRef}
              id="transfer-value"
              label="Transfer Value (MATIC)"
              step={1}
              value={value ? parseFloat(formatEther(value)) : ''}
              onChange={handleValueChange}
              invalid={!!inputWarn}
              invalidText={!!inputWarn ? inputWarn : 'Please enter a value to transfer'}
              className="pt-4"
              style={{ fontWeight: 400 }}
            />
          </>
        ) : status === 'SIGN_TX' && toUser ? (
          <div className="flex flex-row pt-4 gap-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            <div>
              <p>Value:</p>
              <p>
                <span className="italic">Estimated</span>&nbsp;Gas:
              </p>
              <p>
                <span className="italic">Estimated</span>&nbsp;Total:
              </p>
            </div>
            <div className="flex flex-col items-end">
              <p style={{ paddingRight: 0 }}>
                {modalOpen === 'MATIC' && `${formatEther(value)}\xa0`}
                {modalOpen}
                {modalOpen === 'GNFT' && `\xa0#${transactionToken.toString()}`}
              </p>
              {gas.lte(0) ? (
                <SkeletonText className="inline bg-stone-50" />
              ) : (
                <p style={{ paddingRight: 0 }}>{formatEther(gas)}&nbsp;MATIC</p>
              )}
              {gas.lte(0) ? (
                <SkeletonText className="inline bg-stone-50" />
              ) : (
                <p style={{ paddingRight: 0 }}>
                  {modalOpen === 'GNFT' ? formatEther(gas) : formatEther(gas.add(value))}&nbsp;MATIC
                </p>
              )}
            </div>
          </div>
        ) : status === 'WAITING' ? (
          <>
            <p className="pt-4">Waiting for confirmation...</p>
          </>
        ) : status === 'SUCCESS' ? (
          <>
            <p className="pt-4">
              Successfully transferred {modalOpen}
              {modalOpen === 'GNFT' && ` #${transactionToken.toString()}`}
            </p>
          </>
        ) : (
          <>
            <p className="pt-4 pb-2">
              Error while trying to transfer {modalOpen}
              {modalOpen === 'GNFT' && ` #${transactionToken.toString()}`}
            </p>
            <p>Please try again later</p>
          </>
        )}

        {status === 'SIGN_TX' && gas.add(value).gt(maticBalance) && (
          <p className="italic" style={{ fontWeight: 900 }}>
            Insufficient Funds
          </p>
        )}

        {gas.lt(-1) && <p className="italic">Couldn&apos;t estimate gas. Please try again later.</p>}

        <p className="italic mt-4" style={{ fontWeight: 900 }}>
          Transacting on the {networkName} Network.
        </p>
      </ModalBody>
      {(status === 'SET_VALUE' || status === 'SIGN_TX') && (
        <ModalFooter>
          <Button kind="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            kind="primary"
            className={`gradientBG ${
              (status === 'SIGN_TX' && (gas.lte(0) || gas.add(value).gt(maticBalance))) ||
              (status === 'SET_VALUE' && !value)
                ? 'opacity-50'
                : 'opacity-100'
            }`}
            disabled={
              (status === 'SIGN_TX' && (gas.lte(0) || gas.add(value).gt(maticBalance))) ||
              (status === 'SET_VALUE' && !value)
            }
            onClick={handleSubmit}
          >
            {status === 'SET_VALUE' ? 'Next' : 'Transfer'}
          </Button>
        </ModalFooter>
      )}
    </ComposedModal>
  );
}
