import { Dispatch, SetStateAction, useContext, useState } from 'react';
import { Button, ComposedModal, ModalHeader, ModalBody, ModalFooter } from 'carbon-components-react';
import { BigNumber } from 'ethers';

import { WalletContext, prettyAddress } from '../context/Wallet';
import { marketAddress } from '../context/config';
export default function CancelModal({ itemId, modalOpen, setModalOpen }: { itemId: BigNumber, modalOpen: boolean, setModalOpen: Dispatch<SetStateAction<boolean>> }) {
    const { marketContract, provider } = useContext(WalletContext);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelStatus, setCancelStatus] = useState('Cancel Sell');

    const cancelSell = async (itemId: BigNumber) => {
        setIsCancelling(true);
        setCancelStatus('Approve the transaction in your wallet.');
        try {
            const tx = await marketContract.connect(provider.getSigner()).cancelSell(itemId);
            setCancelStatus('Waiting on network confirmation.');
            await tx.wait();
            setCancelStatus('Successfully cancelled sell.');
            setTimeout(() => {
                setModalOpen(false);
            }, 2000);
        } catch (error) {
            console.log(error);
            setCancelStatus('Error cancelling sell.');
            setTimeout(() => {
                setModalOpen(false);
            }, 2000);
        }
    };

    return <ComposedModal open={modalOpen} onClose={() => { setModalOpen(false) }}>
        <ModalHeader label={`Contract ${prettyAddress(marketAddress)}`}>
            <h1>Cancel Sell</h1>
        </ModalHeader>
        <ModalBody>
            <p style={{ marginBottom: '1rem' }}>
                Cancelling the sell of your GNFT will remove the token from the Market and transfer ownership back to you.
            </p>
        </ModalBody>
        <ModalFooter>
            <Button kind="secondary" onClick={() => { setModalOpen(false) }}>Close</Button>
            <Button kind="primary"
                onClick={() => { cancelSell(itemId) }}
                className={`gradientBG ${isCancelling ? 'opacity-50 loading' : 'opacity-100'}`}
                disabled={isCancelling}
            >
                {cancelStatus}
            </Button>
        </ModalFooter>
    </ComposedModal>
}