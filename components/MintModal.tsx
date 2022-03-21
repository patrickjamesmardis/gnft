import { useContext } from 'react';
import Image from 'next/image';
import { Button, ComposedModal, ModalHeader, ModalBody, ModalFooter, TextInput } from 'carbon-components-react';
import { SketchContext } from '../context/Sketch';
import { WalletContext, prettyAddress } from '../context/Wallet';
import { gnftAddress } from '../context/config';

export default function MintModal() {
    const { sketchTitle, sketchDescription, localImage, saveSketch, setSketchTitle, setSketchDescription } = useContext(SketchContext);
    const { mintModalOpen, setMintModalOpen, mintStatus, isMinting, walletError } = useContext(WalletContext);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => setSketchTitle(e.target.value);
    const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => setSketchDescription(e.target.value);
    return <ComposedModal open={mintModalOpen} onClose={() => { setMintModalOpen(false) }}>
        <ModalHeader label={`Contract ${prettyAddress(gnftAddress)}`} >
            <h1>Mint your GNFT</h1>
        </ModalHeader>
        <ModalBody>
            <p style={{ marginBottom: '1rem' }}>
                Review the details below to confirm the metadata associated with your GNFT. If you would like to save a different frame, close this modal, then pause your sketch at the desired frame.
            </p>
            <TextInput
                data-modal-primary-focus
                id="sketchTitle"
                labelText="Title"
                placeholder="GNFT Sketch"
                defaultValue={sketchTitle}
                style={{ marginBottom: '1rem' }}
                onChange={handleTitleChange}
            />
            <TextInput
                id="sketchDescription"
                labelText="Description"
                placeholder="created at g-nft.app"
                defaultValue={sketchDescription}
                style={{ marginBottom: '1rem' }}
                onChange={handleDescriptionChange}
            />
            {localImage && <Image src={localImage} width={500} height={500} className="mintModalImage" alt="Paused frame from P5 sketch canvas to be used for minting NFT." />}
        </ModalBody>
        <ModalFooter>
            <Button kind="secondary" onClick={() => { setMintModalOpen(false) }}>Close</Button>
            <Button kind="primary" onClick={() => { saveSketch() }} disabled={isMinting || walletError?.chandId} className={`gradientBG ${isMinting || walletError?.chainId ? 'opacity-50' : 'opacity-100'} ${isMinting && 'loading'}`}>{mintStatus}</Button>
        </ModalFooter>
    </ComposedModal>
};