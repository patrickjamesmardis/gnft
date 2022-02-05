import { useContext } from 'react';
import { Play16, Pause16 } from '@carbon/icons-react';

import { SketchContext } from '../context/Sketch';
import { WalletContext } from '../context/Wallet';

import MintStatus from './MintStatus';

export default function SketchControls() {
  const { setSketchTitle, setSketchDescription, saveSketch, sketchPaused, setSketchPaused } = useContext(SketchContext);
  const { isMinting, currentAccount, walletError, connect, mintStatus } = useContext(WalletContext);

  const handleTitleChange = (e) => setSketchTitle(e.target.innerHTML);
  const handleDescriptionChange = (e) => setSketchDescription(e.target.innerHTML);

  const toggleSketchPaused = () => setSketchPaused(!sketchPaused);
  return (
    <div className="grid grid-cols-3 z-10 bg-stone-50 dark:bg-stone-900 lg:fixed controlsGrid pt-4">
      {mintStatus !== 'Mint sketch' && (
        <div className="col-span-3">
          <MintStatus />
        </div>
      )}
      <div className="col-span-3 xs:col-span-2">
        <h1 className="text-2xl pl-4 text-gradient">
          <span contentEditable="true" onBlur={handleTitleChange} suppressContentEditableWarning={true}>
            GNFT Sketch
          </span>
        </h1>
        <p className="pl-4 pb-2 text-stone-900 dark:text-stone-50">
          <span contentEditable="true" onBlur={handleDescriptionChange} suppressContentEditableWarning={true}>
            created at g-nft.app
          </span>
        </p>
      </div>
      <div className="justify-self-end self-center flex items-center col-span-3 xs:col-span-1 mb-2 xs:mb-0">
        <button
          className={`gradientBG py-3 px-6 mr-3 text-stone-50 text-left ${
            isMinting || !currentAccount || walletError?.chainId ? 'opacity-50' : 'opacity-100'
          } ${isMinting && 'loading'}`}
          onClick={!currentAccount ? connect : saveSketch}
          disabled={isMinting || walletError?.chainId}
        >
          Mint
        </button>
        <button className="gradientBG-2 py-4 px-4 text-stone-50" onClick={toggleSketchPaused}>
          {sketchPaused ? <Play16 /> : <Pause16 />}
        </button>
      </div>
    </div>
  );
}
