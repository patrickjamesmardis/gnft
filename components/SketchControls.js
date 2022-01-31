import { useContext } from 'react';
import { SketchContext } from '../context/Sketch';
import { WalletContext } from '../context/Wallet';

export default function SketchControls() {
  const { sketchPaused, setSketchPaused, saveSketch } = useContext(SketchContext);
  const { isMinting, currentAccount, connect, mintStatus } = useContext(WalletContext);

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
          isMinting || !currentAccount ? 'opacity-50' : 'opacity-100'
        }`}
        style={{ width: '500px' }}
        onClick={!currentAccount ? connect : saveSketch}
        disabled={isMinting}
      >
        {!currentAccount ? 'Connect your wallet to mint' : mintStatus}
      </button>
    </>
  );
}
