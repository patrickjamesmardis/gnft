import { useContext, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Button, ComposedModal, ModalHeader, ModalBody, ModalFooter, NumberInput } from 'carbon-components-react';
import { WalletContext, prettyAddress } from '../context/Wallet';
import { gnftAddress, marketAddress } from '../context/config';
import ethers, { BigNumber } from 'ethers';

export default function ListItemModal({ tokenId, modalOpen, setModalOpen }: { tokenId: string, modalOpen: boolean, setModalOpen: Dispatch<SetStateAction<boolean>> }) {
    const { gnftContract, marketApproval, marketContract, setMarketApproval, provider } = useContext(WalletContext);
    const [sellPrice, setSellPrice] = useState(10);
    const [validSellPrice, setValidSellPrice] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState('Approve GNFT Market');
    const [isListing, setIsListing] = useState(false);
    const [listStatus, setListStatus] = useState('Sell GNFT');

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

    const getMarketApproval = async () => {
        setIsApproving(true);
        setApprovalStatus('Approve the transaction in your wallet.');
        try {
            const tx = await gnftContract.connect(provider.getSigner()).setApprovalForAll(marketAddress, true);
            setApprovalStatus('Waiting on network confirmation.');
            await tx.wait();
            setApprovalStatus('Successfully approved GNFT Market.');
            setTimeout(() => {
                setIsApproving(false);
                setMarketApproval(true);
            }, 2000);
        } catch (error) {
            console.log(error);
            setApprovalStatus('Error approving GNFT Market.');
            setTimeout(() => {
                setIsApproving(false);
                setApprovalStatus('Approve GNFT Market');
            }, 2000);
        }

    };

    const listItem = async (tokenId: string, sellPrice: number) => {
        setIsListing(true);
        setListStatus('Approve the transaction in your wallet.');
        try {
            const tx = await marketContract.connect(provider.getSigner()).listItem(gnftAddress, tokenId, ethers.utils.parseEther(sellPrice.toString()));
            setListStatus('Waiting on network confirmation.');
            await tx.wait();
            setListStatus(`Successfully listed GNFT #${tokenId}`);
            setTimeout(() => {
                setModalOpen(false);
            }, 5000);
        } catch (error) {
            console.log(error);
            setListStatus('Error listing token.');
            setTimeout(() => {
                setModalOpen(false);
            }, 5000);
        }
    };

    useEffect(() => {
        console.log(sellPrice);
    }, [sellPrice]);

    return <ComposedModal open={modalOpen} onClose={() => { setModalOpen(false) }}>
        <ModalHeader label={`Contract ${prettyAddress(marketAddress)}`}>
            <h1>{marketApproval ? 'Sell your GNFT' : 'Approve the GNFT Market to transfer GNFT Tokens'}</h1>
        </ModalHeader>
        <ModalBody>
            <p style={{ marginBottom: '1rem' }}>
                {marketApproval
                    ? 'Set the listing price of your GNFT. When your token is purchased, the artist will recieve a 20% royalty, and the market will receive a 2% listing fee.'
                    : 'To list your items on the GNFT Market, you must first approve the market contract to transfer tokens on your behalf. Tokens will be transferred to the Market upon listing and to the receiving party upon purchase or cancellation.'
                }
            </p>
            {marketApproval && <NumberInput
                id="sell-price"
                label="Sell Price (MATIC)"
                defaultValue={10}
                step={1}
                value={sellPrice}
                onChange={handleInputChange}
                invalidText="Price must be at least 0.1 MATIC."
                invalid={!validSellPrice}
            />}
        </ModalBody>
        <ModalFooter>
            <Button kind="secondary" onClick={() => { setModalOpen(false) }}>Close</Button>
            <Button kind="primary"
                onClick={() => { marketApproval ? listItem(tokenId, sellPrice) : getMarketApproval() }}
                className={`gradientBG ${!validSellPrice || isListing || isApproving ? 'opacity-50 loading' : 'opacity-100'}`}
                disabled={!validSellPrice || isApproving || isListing}
            >
                {marketApproval ? listStatus : approvalStatus}
            </Button>
        </ModalFooter>
    </ComposedModal>
}