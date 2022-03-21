import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { SkeletonPlaceholder } from 'carbon-components-react';

import { prettyAddress } from '../context/Wallet';
import { marketAddress, MetadataType } from '../context/config';
import { GNFT } from '../types/';

export default function CreatorRow({ creator, token }: { creator: string, token: GNFT.TokenDataStructOutput }) {
    const [imageURI, setImageURI] = useState<string>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [metadata, setMetadata] = useState<MetadataType>(null);

    useEffect(() => {
        axios.get(token.tokenURI).then(({ data }: { data: MetadataType }) => {
            setMetadata(data);
            setImageURI(data.image);
        });
    }, []);


    return <div>
        <div className="flex">
            <div>
                <h2 className="text-xl mb-2">GNFT #{token.id.toNumber()}</h2>
                {!imageLoaded && <SkeletonPlaceholder style={{ width: '250px', height: '250px' }} />}
                {imageURI && <Link href={`/token/${token.id.toNumber()}`}>
                    <a>
                        <Image src={imageURI} width={250} height={250} className={`${imageLoaded && 'hidden'}`} onLoadingComplete={() => { setImageLoaded(true) }} alt={metadata.description} />
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