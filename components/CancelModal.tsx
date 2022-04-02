import Image from 'next/image';
import axios from 'axios';
import { Dispatch, SetStateAction, useContext, useState, useEffect } from 'react';
import { Button, ComposedModal, ModalHeader, ModalBody, ModalFooter, SkeletonText } from 'carbon-components-react';
import { BigNumber } from 'ethers';
import { formatEther, parseUnits } from 'ethers/lib/utils';
import { prettyAddress, WalletContext } from '../context/Wallet';
import { marketAddress, gasStation, GasStationData, networkName } from '../context/config';

export default function CancelModal({
  itemId,
  tokenId,
  modalOpen,
  setModalOpen,
}: {
  itemId: BigNumber;
  tokenId: string;
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const [status, setStatus] = useState<'CANCEL_SELL' | 'WAITING' | 'SUCCESS' | 'ERROR'>('CANCEL_SELL');
  const [gas, setGas] = useState<BigNumber>(BigNumber.from(-1));
  const [gasTimeout, setGasTimeout] = useState(null);
  const { marketContract, maticBalance, provider, updateBalances } = useContext(WalletContext);

  const updateGas = () => {
    setGas(BigNumber.from(-1));
    axios
      .get(gasStation)
      .then(({ data }: { data: GasStationData }) => {
        const gasPrice = parseUnits(data.standard.maxFee.toFixed(9), 'gwei');
        marketContract
          .connect(provider.getSigner())
          .estimateGas.cancelSell(itemId)
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
    if ((!modalOpen && gasTimeout) || (modalOpen && status !== 'CANCEL_SELL' && gasTimeout)) {
      clearTimeout(gasTimeout);
    }
  }, [modalOpen, status, gasTimeout]);

  useEffect(() => {
    if (modalOpen) {
      updateGas();
    } else {
      setStatus('CANCEL_SELL');
      setGas(BigNumber.from(-1));
    }
  }, [modalOpen]);

  const cancelSell = async (itemId: BigNumber) => {
    setStatus('WAITING');
    try {
      const tx = await marketContract.connect(provider.getSigner()).cancelSell(itemId);
      await tx.wait();
      setStatus('SUCCESS');
      updateBalances();
    } catch (error) {
      console.log(error);
      setStatus('ERROR');
    }
  };

  return (
    <ComposedModal
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
      preventCloseOnClickOutside={status === 'WAITING'}
    >
      <ModalHeader
        label={`Contract ${prettyAddress(marketAddress)}`}
        closeIconClassName={status === 'WAITING' ? 'hidden' : 'visible'}
      >
        <h1>Cancel Sell</h1>
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
        {status === 'CANCEL_SELL' ? (
          <>
            <p>
              Cancelling the sell of your GNFT will remove the token from the Market and transfer ownership back to you.
            </p>
            <div className="flex flex-row pt-4 gap-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              <div>
                <p>Transaction:</p>
                <p>
                  <span className="italic">Estimated</span>&nbsp;Gas:
                </p>
              </div>
              <div className="flex flex-col items-end">
                <p style={{ paddingRight: 0 }}>Cancel Sell of GNFT #{tokenId}</p>
                {gas.lte(0) ? (
                  <SkeletonText className="inline bg-stone-50" />
                ) : (
                  <p style={{ paddingRight: 0 }}>{formatEther(gas)}&nbsp;MATIC</p>
                )}
              </div>
            </div>
          </>
        ) : status === 'WAITING' ? (
          <p className="pt-4">Waiting for confirmation...</p>
        ) : status === 'SUCCESS' ? (
          <p className="pt-4">Successfully cancelled sell of GNFT #{tokenId}</p>
        ) : (
          <>
            <p className="pt-4 pb-2">Error while trying to cancel sell.</p>
            <p>Please try again later</p>
          </>
        )}

        {status === 'CANCEL_SELL' && gas.gt(maticBalance) && (
          <p className="italic" style={{ fontWeight: 900 }}>
            Insufficient Funds
          </p>
        )}

        {gas.lt(-1) && <p className="italic">Couldn&apos;t estimate gas. Please try again later.</p>}

        <p className="italic mt-4" style={{ fontWeight: 900 }}>
          Transacting on the {networkName} Network.
        </p>
      </ModalBody>
      {status === 'CANCEL_SELL' && (
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
            onClick={() => {
              cancelSell(itemId);
            }}
            className={`gradientBG ${gas.lte(0) ? 'opacity-50 loading' : 'opacity-100'}`}
            disabled={gas.lte(0) || gas.gt(maticBalance)}
          >
            Cancel Sell
          </Button>
        </ModalFooter>
      )}
    </ComposedModal>
  );
}
