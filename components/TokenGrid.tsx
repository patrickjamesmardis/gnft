import { GNFT } from '../types/';
import TokenCard from './TokenCard';

export default function TokenGrid({ tokens }: { tokens: GNFT.TokenDataStructOutput[] }) {
    return <div className="grid grid-cols-3 gap-4">
        {tokens.map((token) => <TokenCard token={token} key={token.id.toNumber()} />)}
    </div>
}