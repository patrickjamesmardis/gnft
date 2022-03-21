import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { SkeletonPlaceholder } from 'carbon-components-react';
import { MetadataType } from '../context/config';
import { GNFT } from '../types/';

export default function TokenCard({ token }: { token: GNFT.TokenDataStructOutput }) {
    const [imageURI, setImageURI] = useState<string>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [description, setDescription] = useState("");

    useEffect(() => {
        axios.get(token.tokenURI).then(({ data }: { data: MetadataType }) => {
            setImageURI(data.image);
            setDescription(data.description)
        });
    }, []);

    return (<div style={{ width: 'calc((100vw - 112px) / 3)', height: 'calc((100vw - 112px) / 3)' }}>
        {!imageLoaded && <SkeletonPlaceholder className="absolute" style={{ width: 'calc((100vw - 112px) / 3)', height: 'calc((100vw - 112px) / 3)' }} />}
        {imageURI && <Link href={`/token/${token.id.toNumber()}`}>
            <a>
                <Image src={imageURI} width={500} height={500} className={`${!imageLoaded && 'hidden'}`} onLoadingComplete={() => { setImageLoaded(true) }} alt={description} />
            </a>
        </Link>}
    </div>);
}

