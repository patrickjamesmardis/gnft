import Image from 'next/image';
import { Dispatch, SetStateAction, useContext, useState, useRef, useEffect } from 'react';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import { Button, ComposedModal, ModalHeader, ModalBody, ModalFooter, TextInput } from 'carbon-components-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { WalletContext, prettyAddress, rpcProvider } from '../context/Wallet';
import { db, firebaseUrl } from '../firebaseConfig';
import axios from 'axios';
import { BigNumber } from 'ethers';
import { GNFT } from '../types';

const usersRef = collection(db, 'users');

const TokenProfileImage = ({
  token,
  selectedToken,
  setSelectedToken,
}: {
  token: GNFT.TokenDataStructOutput;
  selectedToken: string;
  setSelectedToken: Dispatch<SetStateAction<string>>;
}) => {
  const [image, setImage] = useState('');

  useEffect(() => {
    axios.get(token.tokenURI).then(({ data }) => {
      setImage(data.image);
    });
  }, []);

  return (
    image && (
      <button
        onClick={() => {
          setSelectedToken(image);
        }}
      >
        <Image
          src={image}
          width={selectedToken === image ? 150 : 100}
          height={selectedToken === image ? 150 : 100}
          className="rounded-full"
          alt="user profile image"
        />
      </button>
    )
  );
};

export default function EditProfileModal() {
  const { account, username, setUsername, modalOpen, setModalOpen, generateMagicToken, profileImage, setProfileImage } =
    useContext(WalletContext);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameInvalid, setUsernameInvalid] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [saveMessage, setSaveMessage] = useState('Save');
  const [balance, setBalance] = useState<BigNumber>(BigNumber.from(0));
  const [tokens, setTokens] = useState<GNFT.TokenDataStructOutput[]>([]);
  const [selectedToken, setSelectedToken] = useState(profileImage);
  const userRef = useRef(null);

  useEffect(() => {
    if (modalOpen === 'EDIT_PROFILE') {
      rpcProvider.tokenContract.balanceOf(account).then(setBalance);
    } else {
      setUsernameInput('');
      setUsernameInvalid(false);
      setUsernameTaken(false);
      setSaveMessage('Save');
      setBalance(BigNumber.from(0));
      setTokens([]);
      setSelectedToken('jazz');
    }
  }, [modalOpen]);

  useEffect(() => {
    if (balance.gt(0)) {
      rpcProvider.tokenContract
        .tokensOfOwnerByPage(account, 100, 1)
        .then(setTokens)
        .catch(error => {
          console.log(error);
          setTokens([]);
        });
    }
  }, [balance]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const v = value.toLowerCase();
    if (v.match(/^[a-zA-Z0-9_]{3,20}$/) && v !== username) {
      setUsernameInvalid(false);
      getDocs(query(usersRef, where('username', '==', v))).then(q => {
        if (q.empty) {
          setUsernameTaken(false);
          setUsernameInput(v);
        } else {
          setUsernameTaken(true);
          setUsernameInput(null);
        }
      });
    } else if (v === username) {
      setUsernameInput(v);
      setUsernameInvalid(false);
      setUsernameTaken(false);
    } else {
      setUsernameInput(null);
      setUsernameInvalid(true);
      setUsernameTaken(false);
    }
  };

  const handleSave = () => {
    setSaveMessage('Saving...');
    generateMagicToken().then(token => {
      axios
        .post(
          `${firebaseUrl}/users/${account.toLowerCase()}`,
          { username: usernameInput || username, image: selectedToken },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(res => {
          if (res.data.ok) {
            setUsername(usernameInput || username);
            setProfileImage(selectedToken);
            setSaveMessage('Saved');
          } else {
            setSaveMessage("Couldn't save profile");
            console.log(res.data);
          }
        })
        .catch(error => {
          console.log(error);
          setSaveMessage("Couldn't save profile");
        });
    });
  };

  return (
    <ComposedModal
      open={modalOpen === 'EDIT_PROFILE'}
      onClose={() => {
        setModalOpen(false);
      }}
    >
      <ModalHeader label="GNFT Profile">
        <h1>Edit Profile</h1>
      </ModalHeader>
      <ModalBody>
        <div className="flex flex-col items-center mb-4 gap-1">
          {account && profileImage === 'jazz' && <Jazzicon diameter={100} seed={jsNumberForAddress(account)} />}
          {profileImage !== 'jazz' && (
            <Image src={profileImage} width={100} height={100} alt="profile image" className="rounded-full" />
          )}
          {username && <p style={{ paddingRight: 0 }}>@{username}</p>}
          {account && <p style={{ paddingRight: 0 }}>{prettyAddress(account)}</p>}
        </div>
        <div>
          <TextInput
            data-modal-primary-focus
            ref={userRef}
            id="username"
            labelText="username"
            placeholder={username}
            defaultValue={username}
            onChange={handleUsernameChange}
            value={undefined}
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
        {tokens.length > 0 && (
          <div className="mt-4">
            <p className="mb-4">Select a profile image</p>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                className="rounded-full"
                onClick={() => {
                  setSelectedToken('jazz');
                }}
              >
                <Jazzicon diameter={selectedToken === 'jazz' ? 150 : 100} seed={jsNumberForAddress(account)} />
              </button>
              {tokens.map(token => (
                <TokenProfileImage
                  key={`token-${token.id.toString()}`}
                  token={token}
                  selectedToken={selectedToken}
                  setSelectedToken={setSelectedToken}
                />
              ))}
            </div>
          </div>
        )}
      </ModalBody>
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
          onClick={handleSave}
          disabled={usernameInvalid || usernameTaken || saveMessage !== 'Save'}
          className={`gradientBG ${
            usernameInvalid || usernameTaken || saveMessage !== 'Save' ? 'opacity-50' : 'opacity-100'
          }`}
        >
          {saveMessage}
        </Button>
      </ModalFooter>
    </ComposedModal>
  );
}
