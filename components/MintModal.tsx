import { Dispatch, SetStateAction, useContext, useState, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { useRouter } from 'next/router';
import {
  Button,
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  TextInput,
  unstable_ProgressBar as ProgressBar,
  SkeletonText,
} from 'carbon-components-react';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import { BigNumber } from 'ethers';
import { parseUnits, formatEther } from 'ethers/lib/utils';
import { SketchContext } from '../context/Sketch';
import { prettyAddress, WalletContext } from '../context/Wallet';
import { gnftAddress, gasStation, GasStationData, networkName } from '../context/config';

const client = ipfsHttpClient({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: `Basic ${process.env.NEXT_PUBLIC_INFURA_IPFS}`,
  },
});

export default function MintModal({
  modalOpen,
  setModalOpen,
  localImage,
}: {
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  localImage: string;
}) {
  const { draw, sketchTitle, sketchDescription, setSketchTitle, setSketchDescription, setSketchPaused } =
    useContext(SketchContext);
  const { account, maticBalance, tokenContract, provider, updateBalances } = useContext(WalletContext);
  const [status, setStatus] = useState<'SET_METADATA' | 'SAVING' | 'SIGN_TX' | 'WAITING' | 'SUCCESS' | 'ERROR'>(
    'SET_METADATA'
  );
  const [gas, setGas] = useState<BigNumber>(BigNumber.from(-1));
  const [gasTimeout, setGasTimeout] = useState(null);
  const router = useRouter();
  const [ipfsUrl, setIpfsUrl] = useState('');
  const [imageProgress, setImageProgress] = useState({ prog: 0, total: 0, message: 'Waiting' });
  const [dataProgress, setDataProgress] = useState({ prog: 0, total: 0, message: 'Waiting' });

  const updateGas = () => {
    setGas(BigNumber.from(-1));
    axios
      .get(gasStation)
      .then(({ data }: { data: GasStationData }) => {
        const gasPrice = parseUnits(data.standard.maxFee.toFixed(9), 'gwei');
        tokenContract
          .connect(provider.getSigner())
          .estimateGas.mintToken(ipfsUrl)
          .then(gas => {
            setGas(gasPrice.mul(gas));
            setGasTimeout(setTimeout(updateGas, 30000));
          })
          .catch(error => {
            console.log(error);
            setGas(BigNumber.from(-2));
          });
      })
      .catch(error => {
        console.log(error);
        setGas(BigNumber.from(-3));
      });
  };

  useEffect(() => {
    if (!modalOpen) {
      setStatus('SET_METADATA');
      setGas(BigNumber.from(-1));
      setIpfsUrl('');
      setImageProgress({ prog: 0, total: 0, message: 'Waiting' });
      setDataProgress({ prog: 0, total: 0, message: 'Waiting' });
    }
  }, [modalOpen]);

  useEffect(() => {
    if (status !== 'SIGN_TX' && gasTimeout) {
      clearTimeout(gasTimeout);
    }
  }, [status, gasTimeout]);

  useEffect(() => {
    if (status === 'SIGN_TX' && ipfsUrl) {
      updateGas();
    }
  }, [status, ipfsUrl]);

  const addMetadata = async (file: string) => {
    try {
      const size = Buffer.byteLength(file);
      setDataProgress({ prog: 0, total: size, message: `0 / ${size} B` });
      const added = await client.add(file, {
        pin: true,
        progress: prog => setDataProgress({ prog, total: size, message: `${prog} / ${size} B` }),
      });
      setDataProgress({ prog: size, total: size, message: 'done' });
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      setIpfsUrl(url);
      setStatus('SIGN_TX');
    } catch (error) {
      setStatus('ERROR');
      console.log(error);
    }
  };

  const saveSketch = async () => {
    setStatus('SAVING');
    document.querySelector('canvas').toBlob(async b => {
      try {
        const { size } = b;
        setImageProgress({ prog: 0, total: size, message: `0 / ${size} B` });
        const added = await client.add(b, {
          pin: true,
          progress: prog => setImageProgress({ prog, total: size, message: `${prog} / ${size} B` }),
        });
        setImageProgress({ prog: size, total: size, message: 'done' });
        const image = `https://ipfs.infura.io/ipfs/${added.path}`;
        const name = sketchTitle || 'GNFT Sketch';
        const description = sketchDescription || 'created at g-nft.app';
        addMetadata(JSON.stringify({ name, description, image, sourceCode: draw.trim(), artist: account }));
      } catch (error) {
        setStatus('ERROR');
        console.log(error);
      }
    });
  };

  const mint = async (ipfsUrl: string) => {
    setStatus('WAITING');
    try {
      const tx = await tokenContract.connect(provider.getSigner()).mintToken(ipfsUrl);
      const receipt = await tx.wait();
      const tokenId = receipt.events[0].args[2].toNumber();
      setStatus('SUCCESS');
      updateBalances();
      setTimeout(() => {
        setModalOpen(false);
        setSketchPaused(false);
        router.push(`/token/${tokenId}`);
      }, 2000);
    } catch (error) {
      console.log(error);
      setStatus('ERROR');
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => setSketchTitle(e.target.value);
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => setSketchDescription(e.target.value);
  return (
    <ComposedModal
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
      preventCloseOnClickOutside={status === 'WAITING' || status === 'SAVING'}
    >
      <ModalHeader
        label={`Contract ${prettyAddress(gnftAddress)}`}
        closeIconClassName={status === 'SAVING' || status === 'WAITING' ? 'hidden' : 'visible'}
      >
        <h1>Mint your GNFT</h1>
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
        </div>
        {status === 'SET_METADATA' ? (
          <>
            <p style={{ marginBottom: '1rem' }}>
              Review the details below to confirm the metadata associated with your GNFT. If you would like to save a
              different frame, close this modal, then pause your sketch at the desired frame.
            </p>
            <TextInput
              data-modal-primary-focus
              id="sketchTitle"
              labelText="Title"
              placeholder="GNFT Sketch"
              defaultValue={sketchTitle}
              style={{ marginBottom: '1rem' }}
              onChange={handleTitleChange}
            />
            <TextInput
              id="sketchDescription"
              labelText="Description"
              placeholder="created at g-nft.app"
              defaultValue={sketchDescription}
              style={{ marginBottom: '1rem' }}
              onChange={handleDescriptionChange}
            />
            {localImage && (
              <Image
                src={localImage}
                width={500}
                height={500}
                className="mintModalImage"
                alt="Paused frame from P5 sketch canvas to be used for minting NFT."
                onLoad={() => {
                  URL.revokeObjectURL(localImage);
                }}
              />
            )}
          </>
        ) : status === 'SAVING' ? (
          <>
            <ProgressBar
              label="Image Upload Progress"
              helperText={imageProgress.message}
              max={imageProgress.total > 0 ? imageProgress.total : null}
              value={imageProgress.total > 0 ? imageProgress.prog : null}
            />
            <div className="mt-4">
              <ProgressBar
                label="Metadata Upload Progress"
                helperText={imageProgress.message}
                max={dataProgress.total > 0 ? dataProgress.total : null}
                value={dataProgress.total > 0 ? dataProgress.prog : null}
              />
            </div>
          </>
        ) : status === 'SIGN_TX' ? (
          <div className="flex flex-row pt-4 gap-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            <div>
              <p>Transaction:</p>
              <p>
                <span className="italic">Estimated</span>&nbsp;Gas:
              </p>
            </div>
            <div className="flex flex-col items-end">
              <p style={{ paddingRight: 0 }}>Mint GNFT</p>
              {gas.lte(0) ? (
                <SkeletonText className="inline bg-stone-50" />
              ) : (
                <p style={{ paddingRight: 0 }}>{formatEther(gas)}&nbsp;MATIC</p>
              )}
            </div>
          </div>
        ) : status === 'WAITING' ? (
          <p className="pt-4">Waiting for confirmation...</p>
        ) : status === 'SUCCESS' ? (
          <>
            <p className="pt-4">Successfully minted GNFT. Redirecting to token page ... </p>
          </>
        ) : (
          <>
            <p className="pt-4 pb-2">Error while trying to mint token.</p>
            <p>Please try again later</p>
          </>
        )}

        {status === 'SIGN_TX' && gas.gt(maticBalance) && (
          <p className="italic" style={{ fontWeight: 900 }}>
            Insufficient Funds
          </p>
        )}

        {gas.lt(-1) && <p className="italic">Couldn&apos;t estimate gas. Please try again later.</p>}

        <p className="italic mt-4" style={{ fontWeight: 900 }}>
          Transacting on the {networkName} Network.
        </p>
      </ModalBody>
      {(status === 'SET_METADATA' || status === 'SIGN_TX') && (
        <ModalFooter>
          <Button
            kind="secondary"
            onClick={() => {
              setModalOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            kind="primary"
            onClick={() => {
              status === 'SET_METADATA' ? saveSketch() : mint(ipfsUrl);
            }}
            disabled={status === 'SIGN_TX' && (gas.lt(0) || gas.gt(maticBalance))}
            className={`gradientBG ${status === 'SIGN_TX' && gas.lt(0) ? 'opacity-50 loading' : 'opacity-100'}`}
          >
            {status === 'SET_METADATA' ? 'Save Metadata' : 'Mint Sketch'}
          </Button>
        </ModalFooter>
      )}
    </ComposedModal>
  );
}
