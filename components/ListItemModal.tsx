import Image from 'next/image';
import { useContext, useState, useEffect } from 'react';
import {
  Button,
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  NumberInput,
  SkeletonText,
} from 'carbon-components-react';
import { WalletContext, prettyAddress } from '../context/Wallet';
import { gasStation, GasStationData, gnftAddress, marketAddress, networkName } from '../context/config';
import { ethers, BigNumber } from 'ethers';
import { parseUnits, formatEther } from 'ethers/lib/utils';
import axios from 'axios';

type ModalStatus = 'APPROVAL' | 'SET_PRICE' | 'SIGN_TX' | 'WAITING' | 'SUCCESS' | 'ERROR';

export default function ListItemModal() {
  const {
    marketApproval,
    marketContract,
    maticBalance,
    modalOpen,
    provider,
    setMarketApproval,
    setModalOpen,
    setTransactionToken,
    tokenContract,
    transactionToken,
    updateBalances,
  } = useContext(WalletContext);
  const [sellPrice, setSellPrice] = useState(10);
  const [validSellPrice, setValidSellPrice] = useState(true);
  const [gas, setGas] = useState<BigNumber>(BigNumber.from(-1));
  const [gasTimeout, setGasTimeout] = useState(null);
  const [status, setStatus] = useState<ModalStatus>('APPROVAL');

  useEffect(() => {
    if (modalOpen === 'SELL' && marketApproval) {
      setStatus('SET_PRICE');
    } else if (modalOpen === 'SELL') {
      setStatus('APPROVAL');
    }
  }, [modalOpen]);

  useEffect(() => {
    if (
      (modalOpen === 'SELL' && status !== 'APPROVAL' && status !== 'SIGN_TX' && gasTimeout) ||
      (modalOpen !== 'SELL' && gasTimeout)
    ) {
      clearTimeout(gasTimeout);
    }
  }, [modalOpen, status, gasTimeout]);

  useEffect(() => {
    if (modalOpen === 'SELL' && (status === 'APPROVAL' || status === 'SIGN_TX')) {
      updateGas();
    }
  }, [modalOpen, status]);

  const updateGas = () => {
    setGas(BigNumber.from(-1));
    axios
      .get(gasStation)
      .then(({ data }: { data: GasStationData }) => {
        const gasPrice = parseUnits(data.standard.maxFee.toFixed(9), 'gwei');
        if (status === 'APPROVAL') {
          tokenContract
            .connect(provider.getSigner())
            .estimateGas.setApprovalForAll(marketAddress, true)
            .then(gas => {
              setGas(gasPrice.mul(gas));
              setGasTimeout(setTimeout(updateGas, 30000));
            })
            .catch(error => {
              console.log(error);
              setGas(BigNumber.from(-2));
            });
        } else if (status === 'SIGN_TX') {
          marketContract
            .connect(provider.getSigner())
            .estimateGas.listItem(gnftAddress, transactionToken, ethers.utils.parseEther(sellPrice.toString()))
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

  type NumberInputChange = { value: string; direction: string };
  const handleInputChange = (_: any, direction: NumberInputChange | string) => {
    let value: number;
    if (typeof direction === 'object') {
      value = parseFloat(direction.value);
      setSellPrice(value);
    } else if (direction === 'up') {
      value = sellPrice + 1;
      setSellPrice(value);
    } else if (direction === 'down') {
      value = sellPrice - 1;
      setSellPrice(value);
    }
    if (value < 0.1) {
      setValidSellPrice(false);
    } else {
      setValidSellPrice(true);
    }
  };

  const getMarketApproval = async () => {
    setStatus('WAITING');
    try {
      const tx = await tokenContract.connect(provider.getSigner()).setApprovalForAll(marketAddress, true);
      await tx.wait();
      setStatus('SET_PRICE');
      setMarketApproval(true);
    } catch (error) {
      console.log(error);
      setStatus('ERROR');
    }
  };

  const listItem = async () => {
    setStatus('WAITING');
    try {
      const tx = await marketContract
        .connect(provider.getSigner())
        .listItem(gnftAddress, transactionToken, ethers.utils.parseEther(sellPrice.toString()));
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
    setTransactionToken(BigNumber.from(0));
  };

  return (
    <ComposedModal open={modalOpen === 'SELL'} onClose={handleClose} preventCloseOnClickOutside={status === 'WAITING'}>
      <ModalHeader
        label={`Contract ${prettyAddress(marketAddress)}`}
        closeIconClassName={status === 'WAITING' ? 'hidden' : 'visible'}
      >
        <h1>{marketApproval ? 'Sell your GNFT' : 'Approve the GNFT Market to transfer GNFT Tokens'}</h1>
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
        {status === 'APPROVAL' ? (
          <>
            <p className="pt-4">
              To list your items on the GNFT Market, you must first approve the market contract to transfer tokens on
              your behalf. Tokens will be transferred to the Market upon listing and to the receiving party upon
              purchase or cancellation.
            </p>
            <div className="flex flex-row pt-4 gap-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              <div>
                <p>Transaction:</p>
                <p>
                  <span className="italic">Estimated</span>&nbsp;Gas:
                </p>
              </div>
              <div className="flex flex-col items-end">
                <p style={{ paddingRight: 0 }}>Approve GNFT Market</p>
                {gas.lte(0) ? (
                  <SkeletonText className="inline bg-stone-50" />
                ) : (
                  <p style={{ paddingRight: 0 }}>{formatEther(gas)}&nbsp;MATIC</p>
                )}
              </div>
            </div>
          </>
        ) : status === 'SET_PRICE' ? (
          <>
            <p className="pt-4 pb-2">
              Set the listing price of your GNFT. When your token is purchased, the artist will recieve a 20% royalty,
              and the market will receive a 2% listing fee.
            </p>
            <NumberInput
              id="sell-price"
              label="Sell Price (MATIC)"
              defaultValue={10}
              step={1}
              value={sellPrice}
              onChange={handleInputChange}
              invalidText="Price must be at least 0.1 MATIC."
              invalid={!validSellPrice}
            />
          </>
        ) : status === 'SIGN_TX' ? (
          <>
            <div className="flex flex-row pt-4 gap-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              <div>
                <p>Transaction:</p>
                <p>
                  <span className="italic">Estimated</span>&nbsp;Gas:
                </p>
              </div>
              <div className="flex flex-col items-end">
                <p style={{ paddingRight: 0 }}>
                  List GNFT #{transactionToken.toString()} for {sellPrice} MATIC
                </p>
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
          <p className="pt-4">Successfully listed GNFT #{transactionToken.toString()} </p>
        ) : (
          <>
            <p className="pt-4 pb-2">Error while trying list token.</p>
            <p>Please try again later</p>
          </>
        )}

        {status === 'APPROVAL' ||
          (status === 'SIGN_TX' && gas.gt(maticBalance) && (
            <p className="italic" style={{ fontWeight: 900 }}>
              Insufficient Funds
            </p>
          ))}

        {gas.lt(-1) && <p className="italic">Couldn&apos;t estimate gas. Please try again later.</p>}

        <p className="italic mt-4" style={{ fontWeight: 900 }}>
          Transacting on the {networkName} Network.
        </p>
      </ModalBody>
      {(status === 'APPROVAL' || status === 'SET_PRICE' || status === 'SIGN_TX') && (
        <ModalFooter>
          <Button kind="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button
            kind="primary"
            onClick={() => {
              status === 'APPROVAL' ? getMarketApproval() : status === 'SET_PRICE' ? setStatus('SIGN_TX') : listItem();
            }}
            className={`gradientBG ${
              ((status === 'APPROVAL' || status === 'SIGN_TX') && gas.lte(0)) || !validSellPrice
                ? 'opacity-50'
                : 'opacity-100'
            }`}
            disabled={
              status === 'APPROVAL' || status === 'SIGN_TX' ? gas.lte(0) || gas.gt(maticBalance) : !validSellPrice
            }
          >
            {status === 'APPROVAL' ? 'Approve GNFT Market' : status === 'SET_PRICE' ? 'Continue' : 'Sell GNFT'}
          </Button>
        </ModalFooter>
      )}
    </ComposedModal>
  );
}
