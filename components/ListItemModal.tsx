import { useContext, useState, useEffect } from 'react';
import { Button, ComposedModal, ModalHeader, ModalBody, ModalFooter, NumberInput } from 'carbon-components-react';
import { WalletContext, prettyAddress } from '../context/Wallet';
import { marketAddress } from '../context/config';

export default function ListItemModal({ tokenId }: { tokenId: string }) {
    const { sellStatus, listItem, marketApproval, getMarketApproval, approvalStatus, isApproving, isSelling, listItemModalOpen, setListItemModalOpen } = useContext(WalletContext);
    const [sellPrice, setSellPrice] = useState(10);
    const [validSellPrice, setValidSellPrice] = useState(true);

    type NumberInputChangeType = { value: string, direction: string }
    const handleInputChange = (_: any, direction: NumberInputChangeType | string) => {
        let value: number;
        console.log(direction);
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

    useEffect(() => {
        console.log(sellPrice);
    }, [sellPrice]);

    return <ComposedModal open={listItemModalOpen} onClose={() => { setListItemModalOpen(false) }}>
        <ModalHeader label={`Contract ${prettyAddress(marketAddress)}`}>
            <h1>{marketApproval ? 'Sell your GNFT' : 'Approve the GNFT Market to transfer GNFT Tokens'}</h1>
        </ModalHeader>
        <ModalBody>
            <p style={{ marginBottom: '1rem' }}>
                {marketApproval ? 'Set the listing price of your GNFT. When your token is purchased, the artist will recieve a 20% royalty, and the market will receive a 2% listing fee.' : 'To list your items on the GNFT Market, you must first approve the market contract to transfer tokens on your behalf. Tokens will be transferred to the Market upon listing and to the receiving party upon purchase or cancellation.'}
            </p>
            {marketApproval && <NumberInput id="sell-price" label="Sell Price (MATIC)" defaultValue={10} step={1} value={sellPrice} onChange={handleInputChange} invalidText="Price must be at least 0.1 MATIC." invalid={!validSellPrice} />}
        </ModalBody>
        <ModalFooter>
            <Button kind="secondary" onClick={() => { setListItemModalOpen(false) }}>Close</Button>
            <Button kind="primary" onClick={() => { marketApproval ? listItem(tokenId, sellPrice) : getMarketApproval() }} className={`gradientBG ${!validSellPrice || isSelling || isApproving ? 'opacity-50 loading' : 'opacity-100'}`} disabled={!validSellPrice || isApproving || isSelling}>{marketApproval ? sellStatus : approvalStatus}</Button>
        </ModalFooter>
    </ComposedModal>
}