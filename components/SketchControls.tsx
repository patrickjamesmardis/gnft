import { Dispatch, SetStateAction, useContext } from 'react';
import { Pause16, Play16 } from '@carbon/icons-react';
import { SketchContext } from '../context/Sketch';
import { WalletContext } from '../context/Wallet';

export default function SketchControls({ setModalOpen, status, statusMessage, setLocalImage }: { setModalOpen: Dispatch<SetStateAction<boolean>>, status: boolean, statusMessage: string, setLocalImage: Dispatch<SetStateAction<string>> }) {
  const { sketchPaused, setSketchPaused, sketchError } = useContext(SketchContext);
  const { currentAccount, connect, walletError } = useContext(WalletContext);


  const getSketchBlob = () => {
    document.querySelector('canvas').toBlob(b => {
      const url = URL.createObjectURL(b);
      setLocalImage(url);
    });
  };

  const openMintModal = () => {
    setSketchPaused(true);
    getSketchBlob();
    setModalOpen(true);
  }

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
          className={`gradientBG py-3 px-6 mt-4 text-stone-50 text-left grow ml-2 ${status || !currentAccount || walletError?.chainId ? 'opacity-50' : 'opacity-100'} ${status && 'loading'}`}
          onClick={!currentAccount ? () => { connect() } : () => { openMintModal() }}
          disabled={status || walletError?.chainId}
        >
          {statusMessage}
        </button>

      </div>
      {sketchError && <p className="text-stone-700 dark:text-stone-300 pt-4">{`SketchError: ${sketchError.name}: ${sketchError.message}`}</p>}
    </>
  );
}
