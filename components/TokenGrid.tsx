import { useEffect, useState } from 'react';
import { Token } from '../context/config';
import TokenCard from './TokenCard';

export default function TokenGrid({ tokens }: { tokens: Token[] }) {
  const [darkMode, setDarkMode] = useState(true);
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    } else {
      setDarkMode(false);
    }
    const handleChange = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleChange);

    return () => window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {tokens.map(token => (
        <TokenCard token={token} key={token.id.toNumber()} darkMode={darkMode} />
      ))}
    </div>
  );
}
