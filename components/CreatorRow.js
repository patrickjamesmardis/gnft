import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useContext } from 'react';
import axios from 'axios';

import { WalletContext } from '../context/Wallet';

export default function CreatorRow({ contract, creator, idx }) {
    const [tokenId, setTokenId] = useState(0);
    const [tokenURI, setTokenURI] = useState(null);
    const [imageURI, setImageURI] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const [owner, setOwner] = useState(null);
    const { prettyAddress, marketAddress } = useContext(WalletContext);

    const getTokenURI = async () => {
        const id = await contract.getCreatedTokenByIndex(creator, idx);
        const uri = await contract.tokenURI(id);
        const _owner = await contract.ownerOf(id);
        setOwner(_owner);
        setTokenId(id.toNumber());
        setTokenURI(uri);
    }

    useEffect(() => {
        getTokenURI();
    }, []);

    useEffect(() => {
        if (tokenURI) {
            axios.get(tokenURI).then(data => {
                setMetadata(data.data);
                setImageURI(data.data.image);
            });
        }
    }, [tokenURI]);


    return <div>
        <div className="flex">
            <div>
                <h2 className="text-xl mb-2">GNFT #{tokenId}</h2>
                {imageURI && <Link href={`/token/${tokenId}`}><a><Image src={imageURI} width={250} height={250} /></a></Link>}
            </div>
            <div className="ml-4 mt-7">
                <h3 className="text-xl">{metadata?.name}</h3>
                <p>{metadata?.description}</p>
                <p className="text-xs">Owned by: {owner && (owner === creator ? <span className="text-base text-gradient"><span>you</span></span> : owner === marketAddress ? <span className="text-base">GNFT Market</span> : <span className="text-base">{prettyAddress(owner)}</span>)}</p>
            </div>
        </div>
    </div>;
}