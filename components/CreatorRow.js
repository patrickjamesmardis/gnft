import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { SkeletonPlaceholder } from 'carbon-components-react';

import { WalletContext } from '../context/Wallet';

export default function CreatorRow({ creator, token }) {
    const [imageURI, setImageURI] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [metadata, setMetadata] = useState(null);
    const { prettyAddress, marketAddress } = useContext(WalletContext);

    useEffect(() => {
        axios.get(token.tokenURI).then(data => {
            setMetadata(data.data);
            setImageURI(data.data.image);
        });
    }, []);


    return <div>
        <div className="flex">
            <div>
                <h2 className="text-xl mb-2">GNFT #{token.id.toNumber()}</h2>
                {!imageLoaded && <SkeletonPlaceholder style={{ width: '250px', height: '250px' }} />}
                {imageURI && <Link href={`/token/${token.id.toNumber()}`}>
                    <a>
                        <Image src={imageURI} width={250} height={250} className={`${imageLoaded && 'hidden'}`} onLoadingComplete={() => { setImageLoaded(true) }} />
                    </a>
                </Link>}
            </div>
            <div className="ml-4 mt-7">
                <h3 className="text-xl">{metadata?.name}</h3>
                <p>{metadata?.description}</p>
                <p className="text-xs">Owned by: {token.owner.toLowerCase() === creator ? <span className="text-base text-gradient"><span>you</span></span> : token.owner.toLowerCase() === marketAddress ? <span className="text-base">GNFT Market</span> : <span className="text-base">{prettyAddress(token.owner)}</span>}</p>
            </div>
        </div>
    </div>;
}