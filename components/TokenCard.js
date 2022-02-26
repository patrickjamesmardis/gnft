import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { SkeletonPlaceholder } from 'carbon-components-react';

export default function TokenCard({ contract, owner, idx }) {
    const [tokenId, setTokenId] = useState(0);
    const [tokenURI, setTokenURI] = useState(null);
    const [imageURI, setImageURI] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);

    const getTokenURI = async () => {
        const id = await contract.tokenOfOwnerByIndex(owner, idx);
        const uri = await contract.tokenURI(id);
        setTokenId(id.toNumber());
        setTokenURI(uri);
    }

    useEffect(() => {
        getTokenURI();
    }, []);

    useEffect(() => {
        if (tokenURI) {
            axios.get(tokenURI).then(data => {
                setImageURI(data.data.image)
            });
        }
    }, [tokenURI]);

    return (<div style={{ width: 'calc((100vw - 112px) / 3)', height: 'calc((100vw - 112px) / 3)' }}>
        {!imageLoaded && <SkeletonPlaceholder className="absolute" style={{ width: 'calc((100vw - 112px) / 3)', height: 'calc((100vw - 112px) / 3)' }} />}
        {imageURI && <Link href={`/token/${tokenId}`}>
            <a>
                <Image src={imageURI} width={500} height={500} className={`${!imageLoaded && 'hidden'}`} onLoadingComplete={() => { setImageLoaded(true) }} />
            </a>
        </Link>}
    </div>);
}

