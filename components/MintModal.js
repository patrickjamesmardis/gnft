import { useContext } from 'react';
import Image from 'next/image';
import { Button, ComposedModal, ModalHeader, ModalBody, ModalFooter, TextInput } from 'carbon-components-react';
import { SketchContext } from '../context/Sketch';
import { WalletContext } from '../context/Wallet';

export default function MintModal() {
    const { sketchTitle, sketchDescription, localImage, saveSketch, setSketchTitle, setSketchDescription } = useContext(SketchContext);
    const { gnftAddress, prettyAddress, mintModalOpen, setMintModalOpen, mintStatus, isMinting, walletError } = useContext(WalletContext);

    const handleTitleChange = e => setSketchTitle(e.target.value);
    const handleDescriptionChange = e => setSketchDescription(e.target.value);
    return <ComposedModal
        open={mintModalOpen}
    >
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
            {localImage && <Image src={localImage} width={500} height={500} className="mintModalImage" />}
        </ModalBody>
        <ModalFooter>
            <Button kind="secondary" onClick={() => { setMintModalOpen(false) }}>Close</Button>
            <Button kind="primary" onClick={saveSketch} disabled={isMinting || walletError?.chandId} className={`gradientBG ${isMinting || walletError?.chainId ? 'opacity-50' : 'opacity-100'} ${isMinting && 'loading'}`}>{mintStatus}</Button>
        </ModalFooter>
    </ComposedModal>
};