import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { SkeletonPlaceholder } from 'carbon-components-react';

export default function TokenCard({ token }) {
    const [imageURI, setImageURI] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        axios.get(token.tokenURI).then(data => {
            setImageURI(data.data.image)
        });
    }, []);

    return (<div style={{ width: 'calc((100vw - 112px) / 3)', height: 'calc((100vw - 112px) / 3)' }}>
        {!imageLoaded && <SkeletonPlaceholder className="absolute" style={{ width: 'calc((100vw - 112px) / 3)', height: 'calc((100vw - 112px) / 3)' }} />}
        {imageURI && <Link href={`/token/${token.id.toNumber()}`}>
            <a>
                <Image src={imageURI} width={500} height={500} className={`${!imageLoaded && 'hidden'}`} onLoadingComplete={() => { setImageLoaded(true) }} />
            </a>
        </Link>}
    </div>);
}

