import { Dispatch, SetStateAction, useContext } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Button, ComposedModal, ModalHeader, ModalBody, ModalFooter, TextInput } from 'carbon-components-react';
import { create as ipfsHttpClient } from 'ipfs-http-client';

import { SketchContext } from '../context/Sketch';
import { WalletContext, prettyAddress } from '../context/Wallet';
import { gnftAddress } from '../context/config';

const client = ipfsHttpClient({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: `Basic ${process.env.NEXT_PUBLIC_INFURA_IPFS}`,
    },
});

export default function MintModal({ modalOpen, setModalOpen, status, setStatus, statusMessage, setStatusMesasge, localImage }: { modalOpen: boolean, setModalOpen: Dispatch<SetStateAction<boolean>>, status: boolean, setStatus: Dispatch<SetStateAction<boolean>>, statusMessage: string, setStatusMesasge: Dispatch<SetStateAction<string>>, localImage: string }) {
    const { draw, sketchTitle, sketchDescription, setSketchTitle, setSketchDescription, setSketchPaused } = useContext(SketchContext);
    const { currentAccount, gnftContract, provider, walletError } = useContext(WalletContext);
    const router = useRouter();

    const addMetadata = async (file: string) => {
        try {
            const size = Buffer.byteLength(file);
            setStatusMesasge(`Uploading metadata to IFPS. (0 / ${size} B)`);
            const added = await client.add(file, {
                pin: true,
                progress: (prog) => setStatusMesasge(`Uploading metadata to IFPS. (${prog} / ${size} B)`),
            });
            const url = `https://ipfs.infura.io/ipfs/${added.path}`;
            mint(url);
        } catch (error) {
            setStatus(false);
            setStatusMesasge('Error uploading metadata to IPFS.');
            setTimeout(() => {
                setModalOpen(false);
            }, 5000);
            console.log(error);
        }
    };

    const saveSketch = async () => {
        setStatusMesasge('Uploading image to IPFS.');
        setStatus(true);
        document.querySelector('canvas').toBlob(async b => {
            try {
                const { size } = b;
                setStatusMesasge(`Uploading image to IPFS. (0 / ${size} B)`);
                const added = await client.add(b, {
                    pin: true,
                    progress: (prog) => setStatusMesasge(`Uploading image to IPFS. (${prog} / ${size} B)`),
                });
                const image = `https://ipfs.infura.io/ipfs/${added.path}`;
                const name = sketchTitle || 'GNFT Sketch';
                const description = sketchDescription || 'created at g-nft.app';
                addMetadata(JSON.stringify({ name, description, image, sourceCode: draw.trim(), artist: currentAccount }));
            } catch (error) {
                setStatus(false);
                setStatusMesasge('Error uploading image to IPFS.');
                setTimeout(() => {
                    setModalOpen(false);
                }, 5000);
                console.log(error);
            }
        });
    };

    const mint = async (ipfsUrl: string) => {
        setStatusMesasge('Approve the transaction in your wallet.');
        try {
            const tx = await gnftContract.connect(provider.getSigner()).mintToken(ipfsUrl);
            setStatusMesasge('Waiting on network confirmation.');
            const receipt = await tx.wait();
            const tokenId = receipt.events[0].args[2].toNumber();
            setStatusMesasge(`Successfully minted GNFT token #${tokenId}.`);
            setTimeout(() => {
                setModalOpen(false);
                setSketchPaused(false);
                router.push(`/token/${tokenId}`);
            }, 2000);
        } catch (error) {
            console.log(error);
            setStatusMesasge('Error minting token.');
            setTimeout(() => {
                setModalOpen(false);
            }, 5000);
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => setSketchTitle(e.target.value);
    const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => setSketchDescription(e.target.value);
    return <ComposedModal open={modalOpen} onClose={() => { setModalOpen(false) }}>
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
            {localImage && <Image src={localImage} width={500} height={500} className="mintModalImage" alt="Paused frame from P5 sketch canvas to be used for minting NFT." onLoad={() => { URL.revokeObjectURL(localImage) }} />}
        </ModalBody>
        <ModalFooter>
            <Button kind="secondary" onClick={() => { setModalOpen(false) }}>Close</Button>
            <Button kind="primary" onClick={() => { saveSketch() }} disabled={status || walletError?.chandId} className={`gradientBG ${status || walletError?.chainId ? 'opacity-50' : 'opacity-100'} ${status && 'loading'}`}>{statusMessage}</Button>
        </ModalFooter>
    </ComposedModal>
};