import TokenCard from './TokenCard';

export default function TokenGrid({ page, pageSize, balance, contract, owner }) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(balance - 1, startIndex + pageSize - 1);
    const actualPageSize = endIndex - startIndex + 1;
    const tokens = Array(actualPageSize).fill(1);
    return <div className="grid grid-cols-3 gap-4">
        {tokens.map((token, idx) => <TokenCard contract={contract} owner={owner} key={idx + startIndex} idx={idx + startIndex} />)}
    </div>
}