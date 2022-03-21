import { GNFT } from '../types/';
import CreatorRow from './CreatorRow';

export default function CreatorGrid({ creator, tokens }: { creator: string, tokens: GNFT.TokenDataStructOutput[] }) {
    console.log(tokens);
    return <div className="grid grid-cols-1 gap-4">
        {tokens.map((token) => <CreatorRow token={token} creator={creator} key={token.id.toNumber()} />)}
    </div>;
}