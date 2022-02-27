import CreatorRow from './CreatorRow';

export default function CreatorGrid({ page, pageSize, balance, contract, creator }) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(balance - 1, startIndex + pageSize - 1);
    const actualPageSize = endIndex - startIndex + 1;
    const tokens = Array(actualPageSize).fill(1);
    return <div className="grid grid-cols-1 gap-4">
        {tokens.map((token, idx) => <CreatorRow contract={contract} creator={creator} key={idx + startIndex} idx={idx + startIndex} />)}
    </div>;
}