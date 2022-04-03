import { useContext, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import axios from 'axios';
import {
  Button,
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  SkeletonText,
  TextInput,
} from 'carbon-components-react';
import { Phone16, Wallet16 } from '@carbon/icons-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import PhoneInput from 'react-phone-input-2';
import { prettyAddress, WalletContext } from '../context/Wallet';
import { db, firebaseUrl } from '../firebaseConfig';

const usersRef = collection(db, 'users');

export default function ConnectModal() {
  const [phone, setPhone] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameInvalid, setUsernameInvalid] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const { clearLoginError, login, magicUserMeta, setUsername, username, modalOpen, setModalOpen, generateMagicToken } =
    useContext(WalletContext);
  const phoneRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    if (username && username !== 'LOADING' && username !== 'ERROR') {
      setModalOpen(false);
    }
  }, [username]);

  useEffect(() => {
    if (!modalOpen) {
      clearLoginError();
    }
  }, [modalOpen]);

  useEffect(() => {
    if (modalOpen === 'CONNECT') {
      if (!magicUserMeta && phoneRef.current) {
        phoneRef.current.focus();
      } else if (!username && userRef.current) {
        userRef.current.focus();
      }
    }
  }, [modalOpen, magicUserMeta, username]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const v = value.toLowerCase();
    if (v.match(/^[a-zA-Z0-9_]{3,20}$/)) {
      setUsernameInvalid(false);
      getDocs(query(usersRef, where('username', '==', v))).then(q => {
        if (q.empty) {
          setUsernameTaken(false);
          setUsernameInput(v);
        } else {
          setUsernameTaken(true);
        }
      });
    } else {
      setUsernameInvalid(true);
      setUsernameTaken(false);
    }
  };

  const handleLogin = (_phone: string) => login(`+${_phone}`);

  const handleProfile = (metadata: { publicAddress: string }, uname: string) => {
    setUsername('LOADING');
    generateMagicToken().then(token =>
      axios
        .post(
          `${firebaseUrl}/users/${metadata.publicAddress.toLowerCase()}`,
          { username: uname, image: 'jazz' },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(res => {
          if (res.data.ok) {
            setUsername(uname);
          } else {
            console.log(res.data);
            setUsername('ERROR');
          }
        })
        .catch(error => {
          console.log(error);
          setUsername('ERROR');
        })
    );
  };

  return (
    <ComposedModal
      open={modalOpen === 'CONNECT'}
      onClose={() => {
        setModalOpen(false);
      }}
      preventCloseOnClickOutside={
        magicUserMeta === 'INIT_LOAD' || magicUserMeta === 'LOADING' || username === 'LOADING'
      }
    >
      <ModalHeader
        label="GNFT Wallet"
        closeIconClassName={
          magicUserMeta === 'INIT_LOAD' || magicUserMeta === 'LOADING' || username === 'LOADING' ? 'hidden' : 'visible'
        }
      >
        <h1>
          {magicUserMeta === 'ERROR'
            ? "Couldn't connect to wallet"
            : username === 'ERROR'
            ? "Couldn't connect to profile"
            : magicUserMeta === 'LOADING' || magicUserMeta === 'INIT_LOAD'
            ? 'Magic Loading'
            : !magicUserMeta
            ? 'Connect to your GNFT wallet'
            : username === 'LOADING'
            ? 'Profile Loading'
            : !username
            ? 'Setup your profile'
            : `@${username}`}
        </h1>
      </ModalHeader>
      <ModalBody>
        <div className="flex flex-col items-center mb-4">
          {typeof magicUserMeta === 'string' || !magicUserMeta ? (
            <Image src="/wallet.svg" alt="Wallet Icon" width={100} height={100} priority />
          ) : (
            <Jazzicon diameter={100} seed={jsNumberForAddress(magicUserMeta.publicAddress)} />
          )}
        </div>
        {magicUserMeta === 'LOADING' || magicUserMeta === 'INIT_LOAD' ? (
          <>
            <SkeletonText width="364px" className="mb-4 bg-stone-50" />
            <SkeletonText width="100%" className="h-[35px]  bg-stone-50" />
          </>
        ) : magicUserMeta === 'ERROR' || username === 'ERROR' ? (
          <>
            <p>Please try again</p>
          </>
        ) : !magicUserMeta ? (
          <>
            <p className="mb-4">Enter your phone number to connect to your wallet.</p>
            <PhoneInput
              inputProps={{ ref: phoneRef, ['data-modal-primary-focus']: true }}
              country="us"
              value={phone}
              onChange={phone => setPhone(phone)}
              placeholder="1 (423) 123-4567"
            />
            <p className="mt-4">
              By submitting your phone number, you are logging into or creating a Polygon Wallet powered by{' '}
              <a href="https://magic.link" target="_blank" rel="noreferrer" className="underline">
                Magic
              </a>
              . Private keys are secured by Magic and cannot be accessed by GNFT. You can read{' '}
              <a href="https://magic.link/legal/user-terms" target="_blank" rel="noreferrer" className="underline">
                Magic&apos;s End-User Terms of Service here
              </a>
              .
            </p>
          </>
        ) : !username || username === 'LOADING' ? (
          <>
            {username === 'LOADING' ? (
              <>
                <SkeletonText width="100%" className="h-[48px] mb-2 bg-stone-50" />
                <SkeletonText width="300px" className="h-[24px] bg-stone-50" />
              </>
            ) : (
              <>
                <div>
                  <TextInput
                    data-modal-primary-focus
                    ref={userRef}
                    id="username"
                    labelText="username"
                    placeholder="user_1234"
                    onChange={handleUsernameChange}
                    warn={usernameInvalid || usernameTaken}
                    warnText={
                      usernameInvalid
                        ? 'Username must be 3-20 characters long and contain only letters, numbers, or underscores.'
                        : usernameTaken
                        ? 'Username taken'
                        : undefined
                    }
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <>Welcome back</>
        )}

        {magicUserMeta && typeof magicUserMeta !== 'string' && (
          <>
            <p className="flex flex-row items-center pt-4 pb-2">
              <Phone16 className="inline mr-2" />
              {magicUserMeta.phoneNumber}
            </p>
            <p className="flex flex-row items-center">
              <Wallet16 className="inline mr-2" />
              {prettyAddress(magicUserMeta.publicAddress)}
            </p>
          </>
        )}
      </ModalBody>
      {typeof magicUserMeta !== 'string' && !username && (
        <ModalFooter>
          <Button
            kind="secondary"
            onClick={() => {
              setModalOpen(false);
            }}
          >
            Close
          </Button>
          <Button
            kind="primary"
            onClick={
              !magicUserMeta
                ? () => {
                    handleLogin(phone);
                  }
                : () => {
                    handleProfile(magicUserMeta, usernameInput);
                  }
            }
            className={`gradientBG ${
              magicUserMeta && (usernameInvalid || usernameTaken || !usernameInput) ? 'opacity-50' : 'opacity-100'
            }`}
            disabled={magicUserMeta && (usernameInvalid || usernameTaken || !usernameInput)}
          >
            {!magicUserMeta ? 'Connect' : 'Submit'}
          </Button>
        </ModalFooter>
      )}
    </ComposedModal>
  );
}
