import { useContext } from 'react';
import { Pause16, Play16 } from '@carbon/icons-react';
import { SketchContext } from '../context/Sketch';
import { WalletContext } from '../context/Wallet';

export default function SketchControls() {
  const { sketchPaused, setSketchPaused, openMintModal, sketchError } = useContext(SketchContext);
  const { isMinting, currentAccount, connect, mintStatus, walletError } = useContext(WalletContext);

  const toggleSketchPaused = () => setSketchPaused(!sketchPaused);
  return (
    <>
      <div className="controlsContainer flex">
        <button
          className="gradientBG-2 py-4 px-6 mt-4 text-stone-50 text-left"
          onClick={toggleSketchPaused}
        >
          {sketchPaused ? <Play16 /> : <Pause16 />}
        </button>
        <button
          className={`gradientBG py-3 px-6 mt-4 text-stone-50 text-left grow ml-2 ${isMinting || !currentAccount || walletError?.chainId ? 'opacity-50' : 'opacity-100'} ${isMinting && 'loading'}`}
          onClick={!currentAccount ? connect : openMintModal}
          disabled={isMinting || walletError?.chainId}
        >
          {mintStatus}
        </button>

      </div>
      {sketchError && <p className="text-stone-700 dark:text-stone-300 pt-4">{`SketchError: ${sketchError.name}: ${sketchError.message}`}</p>}
    </>
  );
}
