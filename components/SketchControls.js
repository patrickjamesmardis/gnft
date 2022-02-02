import { useContext } from 'react';
import { SketchContext } from '../context/Sketch';
import { WalletContext } from '../context/Wallet';

export default function SketchControls() {
  const { sketchPaused, setSketchPaused, saveSketch } = useContext(SketchContext);
  const { isMinting, currentAccount, connect, mintStatus, walletError } = useContext(WalletContext);

  const toggleSketchPaused = () => setSketchPaused(!sketchPaused);
  return (
    <>
      <button
        className="gradientBG-2 py-3 px-6 mt-2 text-stone-50 text-left"
        style={{ width: '500px' }}
        onClick={toggleSketchPaused}
      >
        {sketchPaused ? 'Play Sketch' : 'Pause Sketch'}
      </button>
      <button
        className={`gradientBG py-3 px-6 mt-2 text-stone-50 text-left ${
          isMinting || !currentAccount || walletError?.chainId ? 'opacity-50' : 'opacity-100'
        } ${isMinting && 'loading'}`}
        style={{ width: '500px' }}
        onClick={!currentAccount ? connect : saveSketch}
        disabled={isMinting || walletError?.chainId}
      >
        {!currentAccount
          ? 'Connect your wallet to mint'
          : walletError?.chainId
          ? 'Connect to the Mumbai Testnet'
          : mintStatus}
      </button>
    </>
  );
}
