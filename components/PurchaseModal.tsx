import Image from 'next/image';
import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { Button, ComposedModal, ModalHeader, ModalBody, ModalFooter, SkeletonText } from 'carbon-components-react';
import { BigNumber } from 'ethers';
import { formatEther, parseUnits } from 'ethers/lib/utils';
import { prettyAddress, WalletContext } from '../context/Wallet';
import { gasStation, GasStationData, marketAddress, networkName } from '../context/config';

export default function PurchaseModal() {
  const [status, setStatus] = useState<'PURCHASE' | 'WAITING' | 'SUCCESS' | 'ERROR'>('PURCHASE');
  const [gas, setGas] = useState<BigNumber>(BigNumber.from(-1));
  const [gasTimeout, setGasTimeout] = useState(null);
  const {
    marketContract,
    maticBalance,
    provider,
    updateBalances,
    transactionItem,
    transactionToken,
    transactionPrice,
    setTransactionItem,
    setTransactionPrice,
    setTransactionToken,
    modalOpen,
    setModalOpen,
  } = useContext(WalletContext);

  const updateGas = () => {
    setGas(BigNumber.from(-1));
    axios
      .get(gasStation)
      .then(({ data }: { data: GasStationData }) => {
        const gasPrice = parseUnits(data.standard.maxFee.toFixed(9), 'gwei');
        marketContract
          .connect(provider.getSigner())
          .estimateGas.purchaseItem(transactionItem, { value: transactionPrice })
          .then(gas => {
            setGas(gas.mul(gas));
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
    if ((modalOpen !== 'PURCHASE' && gasTimeout) || (modalOpen === 'PURCHASE' && status !== 'PURCHASE' && gasTimeout)) {
      clearTimeout(gasTimeout);
    }
  }, [modalOpen, status, gasTimeout]);

  useEffect(() => {
    if (modalOpen === 'PURCHASE') {
      updateGas();
    } else {
      setStatus('PURCHASE');
      setGas(BigNumber.from(-1));
    }
  }, [modalOpen]);

  const purchaseItem = async (transactionItem: BigNumber, transactionPrice: BigNumber) => {
    setStatus('WAITING');
    try {
      const tx = await marketContract
        .connect(provider.getSigner())
        .purchaseItem(transactionItem, { value: transactionPrice });
      await tx.wait();
      setStatus('SUCCESS');
      updateBalances();
    } catch (error) {
      console.log(error);
      setStatus('ERROR');
    }
  };

  const handleClose = () => {
    setModalOpen(false);
    setTransactionItem(BigNumber.from(0));
    setTransactionToken(BigNumber.from(0));
    setTransactionPrice(BigNumber.from(0));
  };

  return (
    <ComposedModal
      open={modalOpen === 'PURCHASE'}
      onClose={handleClose}
      preventCloseOnClickOutside={status === 'WAITING'}
    >
      <ModalHeader
        label={`Contract ${prettyAddress(marketAddress)}`}
        closeIconClassName={status === 'WAITING' ? 'hidden' : 'visible'}
      >
        <h1>Purchase GNFT</h1>
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
        {status === 'PURCHASE' ? (
          <>
            <p>
              Upon purchase, the artist will receive a 20% royalty, and the market will receive a 2% listing fee. The
              remainder of the funds will go to the seller, and the GNFT will be transferred to you.
            </p>
            <div className="flex flex-row pt-4 gap-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              <div>
                <p>Transaction:</p>
                <p>Value:</p>
                <p>
                  <span className="italic">Estimated</span>&nbsp;Gas:
                </p>
                <p>
                  <span className="italic">Estimated</span>&nbsp;Total:
                </p>
              </div>
              <div className="flex flex-col items-end">
                <p style={{ paddingRight: 0 }}>Purchase GNFT #{transactionToken.toString()}</p>
                <p style={{ paddingRight: 0 }}>{formatEther(transactionPrice)} MATIC</p>
                {gas.lte(0) ? (
                  <SkeletonText className="inline bg-stone-50" />
                ) : (
                  <p style={{ paddingRight: 0 }}>{formatEther(gas)}&nbsp;MATIC</p>
                )}
                {gas.lte(0) ? (
                  <SkeletonText className="inline bg-stone-50" />
                ) : (
                  <p style={{ paddingRight: 0 }}>{formatEther(gas.add(transactionPrice))}&nbsp;MATIC</p>
                )}
              </div>
            </div>
          </>
        ) : status === 'WAITING' ? (
          <p className="pt-4">Waiting for confirmation...</p>
        ) : status === 'SUCCESS' ? (
          <p className="pt-4">Successfully purchased GNFT #{transactionToken.toString()}</p>
        ) : (
          <>
            <p className="pt-4 pb-2">Error while trying to purchase GNFT #{transactionToken.toString()}.</p>
            <p>Please try again later</p>
          </>
        )}

        {status === 'PURCHASE' && gas.add(transactionPrice).gt(maticBalance) && (
          <p className="italic" style={{ fontWeight: 900 }}>
            Insufficient Funds
          </p>
        )}

        {gas.lt(-1) && <p className="italic">Couldn&apos;t estimate gas. Please try again later.</p>}

        <p className="italic mt-4" style={{ fontWeight: 900 }}>
          Transacting on the {networkName} Network.
        </p>
      </ModalBody>

      {status === 'PURCHASE' && (
        <ModalFooter>
          <Button kind="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button
            kind="primary"
            onClick={() => {
              purchaseItem(transactionItem, transactionPrice);
            }}
            className={`gradientBG ${
              gas.lte(0) || gas.add(transactionPrice).gt(maticBalance) ? 'opacity-50 loading' : 'opacity-100'
            }`}
            disabled={gas.lte(0) || gas.add(transactionPrice).gt(maticBalance)}
          >
            Purchase GNFT
          </Button>
        </ModalFooter>
      )}
    </ComposedModal>
  );
}
