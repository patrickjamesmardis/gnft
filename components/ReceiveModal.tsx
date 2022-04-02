import { Dispatch, SetStateAction, useContext } from 'react';
import Image from 'next/image';
import { ComposedModal, CopyButton, ModalBody, ModalHeader } from 'carbon-components-react';
import { WalletContext } from '../context/Wallet';
import { deployedChainId, networkName } from '../context/config';

export default function ReceiveModal() {
  const { account, modalOpen, setModalOpen } = useContext(WalletContext);
  return (
    <ComposedModal
      open={modalOpen === 'RECEIVE'}
      onClose={() => {
        setModalOpen(false);
      }}
    >
      <ModalHeader label="GNFT Wallet">
        <h1>Receive MATIC</h1>
      </ModalHeader>
      <ModalBody>
        <div className="flex flex-col items-center mb-4">
          {
            // @ts-ignore
            deployedChainId === 137 ? (
              <Image
                src={`https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${account}`}
                alt="Address QR Code"
                width={200}
                height={200}
              />
            ) : (
              <Image src="/wallet.svg" alt="Wallet Icon" width={100} height={100} priority />
            )
          }
          <div className="flex flex-row items-center">
            <p className="break-all" style={{ paddingRight: 0 }}>
              {account}
            </p>
            <CopyButton
              onClick={() => {
                navigator.clipboard.writeText(account);
              }}
              iconDescription="Copy Address"
              feedback="Address Copied!"
              className="inline-flex"
            />
          </div>
        </div>
        {
          // @ts-ignore
          deployedChainId === 137 ? (
            <>
              <h2 className="text-base mb-4">Want to purchase MATIC? Check out the following on-ramps:</h2>
              <ul className="mb-2">
                <li className="mb-2">
                  <a href="https://ramp.network/buy" target="_blank" className="underline" rel="noreferrer">
                    Ramp
                  </a>
                </li>
                <li className="mb-2">
                  <a href="https://moonpay.com/buy" target="_blank" className="underline" rel="noreferrer">
                    MoonPay
                  </a>
                </li>
                <li className="mb-2">
                  <a href="https://global.transak.com" target="_blank" className="underline" rel="noreferrer">
                    Transak
                  </a>
                </li>
              </ul>
            </>
          ) : (
            <>
              <p className="mb-4">
                Copy your address and head over to{' '}
                <a href="https://faucet.polygon.technology/" target="_blank" className="underline" rel="noreferrer">
                  Polygon&apos;s faucet
                </a>{' '}
                to request test MATIC.
              </p>
            </>
          )
        }

        <p
          className="italic"
          style={{ fontWeight: 900 }}
        >{`Make sure you only send MATIC to your address on the ${networkName} Network.`}</p>
      </ModalBody>
    </ComposedModal>
  );
}
