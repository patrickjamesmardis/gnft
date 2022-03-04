import { useContext } from 'react';
import { Button, ComposedModal, ModalHeader, ModalBody, ModalFooter } from 'carbon-components-react';
import { WalletContext } from '../context/Wallet';

export default function PurchaseModal({ itemId, price }) {
    const { marketAddress, prettyAddress, purchaseModalOpen, setPurchaseModalOpen, isPurchasing, purchaseStatus, purchaseItem } = useContext(WalletContext);

    return <ComposedModal open={purchaseModalOpen} onClose={() => { setPurchaseModalOpen(false) }}>
        <ModalHeader label={`Contract ${prettyAddress(marketAddress)}`}>
            <h1>Purchase GNFT</h1>
        </ModalHeader>
        <ModalBody>
            <p style={{ marginBottom: '1rem' }}>
                Upon purchase, the artist will receive a 20% royalty, and the market will receive a 2% listing fee. The remainder of the funds will go to the seller, and the GNFT will be transferred to you.
            </p>
        </ModalBody>
        <ModalFooter>
            <Button kind="secondary" onClick={() => { setPurchaseModalOpen(false) }}>Close</Button>
            <Button kind="primary" onClick={() => { purchaseItem(itemId, price) }} className={`gradientBG ${isPurchasing ? 'opacity-50 loading' : 'opacity-100'}`} disabled={isPurchasing}>{purchaseStatus}</Button>
        </ModalFooter>
    </ComposedModal>
}