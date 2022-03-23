import { Dispatch, SetStateAction, useContext, useState } from 'react';
import { Button, ComposedModal, ModalHeader, ModalBody, ModalFooter } from 'carbon-components-react';
import { BigNumber } from 'ethers';

import { prettyAddress, WalletContext } from '../context/Wallet';
import { marketAddress } from '../context/config';

export default function PurchaseModal({ itemId, price, modalOpen, setModalOpen }: { itemId: BigNumber, price: BigNumber, modalOpen: boolean, setModalOpen: Dispatch<SetStateAction<boolean>> }) {
    const { marketContract, provider } = useContext(WalletContext);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseStatus, setPurchaseStatus] = useState('Purchase GNFT');

    const purchaseItem = async (itemId: BigNumber, price: BigNumber) => {
        setIsPurchasing(true);
        setPurchaseStatus('Approve the transaction in your wallet.');
        try {
            const tx = await marketContract.connect(provider.getSigner()).purchaseItem(itemId, { value: price });
            setPurchaseStatus('Waiting on network confirmation');
            await tx.wait();
            setPurchaseStatus('Successfully purchased GNFT.');
            setTimeout(() => {
                setModalOpen(false);
            }, 2000);
        } catch (error) {
            console.log(error);
            if (error.data.message.match('insufficient funds')) {
                setPurchaseStatus('Insufficient funds to purchase GNFT.');
            } else {
                setPurchaseStatus('Error purchasing GNFT.');
            }
            setTimeout(() => {
                setModalOpen(false);
            }, 2000);
        }
    }

    return <ComposedModal open={modalOpen} onClose={() => { setModalOpen(false) }}>
        <ModalHeader label={`Contract ${prettyAddress(marketAddress)}`}>
            <h1>Purchase GNFT</h1>
        </ModalHeader>
        <ModalBody>
            <p style={{ marginBottom: '1rem' }}>
                Upon purchase, the artist will receive a 20% royalty, and the market will receive a 2% listing fee. The remainder of the funds will go to the seller, and the GNFT will be transferred to you.
            </p>
        </ModalBody>
        <ModalFooter>
            <Button kind="secondary" onClick={() => { setModalOpen(false) }}>Close</Button>
            <Button kind="primary"
                onClick={() => { purchaseItem(itemId, price) }}
                className={`gradientBG ${isPurchasing ? 'opacity-50 loading' : 'opacity-100'}`}
                disabled={isPurchasing}
            >
                {purchaseStatus}
            </Button>
        </ModalFooter>
    </ComposedModal>
}