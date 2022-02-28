import { useContext } from 'react';
import { Button, ComposedModal, ModalHeader, ModalBody, ModalFooter } from 'carbon-components-react';
import { WalletContext } from '../context/Wallet';

export default function CancelModal({ itemId }) {
    const { cancelModalOpen, setCancelModalOpen, marketAddress, isCancelling, cancelStatus, cancelSell, prettyAddress } = useContext(WalletContext);

    return <ComposedModal open={cancelModalOpen} onClose={() => { setCancelModalOpen(false) }}>
        <ModalHeader label={`Contract ${prettyAddress(marketAddress)}`}>
            <h1>Cancel Sell</h1>
        </ModalHeader>
        <ModalBody>
            <p style={{ marginBottom: '1rem' }}>
                Cancelling the sell of your GNFT will remove the token from the Market and transfer ownership back to you.
            </p>
        </ModalBody>
        <ModalFooter>
            <Button kind="secondary" onClick={() => { setCancelModalOpen(false) }}>Close</Button>
            <Button kind="primary" onClick={() => { cancelSell(itemId) }} className={`gradientBG ${isCancelling ? 'opacity-50 loading' : 'opacity-100'}`} disabled={isCancelling}>{cancelStatus}</Button>
        </ModalFooter>
    </ComposedModal>
}