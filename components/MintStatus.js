import { useContext } from 'react';
import { Information16 } from '@carbon/icons-react';
import { WalletContext } from '../context/Wallet';

export default function MintStatus() {
  const { mintStatus } = useContext(WalletContext);
  return (
    <p className="flex items-center pl-4 text-stone-400 text-sm sm:text-base">
      <Information16 className="mr-3" />
      {mintStatus}
    </p>
  );
}
