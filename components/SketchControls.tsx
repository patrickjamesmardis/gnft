import { Dispatch, SetStateAction, useContext, useState } from 'react';
import { ColorPalette16, Pause16, Play16 } from '@carbon/icons-react';
import { SketchContext } from '../context/Sketch';
import { WalletContext } from '../context/Wallet';
import { ColorResult, SwatchesPicker } from 'react-color';

export default function SketchControls({
  setMintOpen,
  setLocalImage,
}: {
  setMintOpen: Dispatch<SetStateAction<boolean>>;
  setLocalImage: Dispatch<SetStateAction<string>>;
}) {
  const { bgColor, sketchPaused, setBgColor, setSketchPaused, sketchError } = useContext(SketchContext);
  const { account, setModalOpen } = useContext(WalletContext);
  const [colorPicker, setColorPicker] = useState(false);

  const getSketchBlob = () => {
    document.querySelector('canvas').toBlob(b => {
      const url = URL.createObjectURL(b);
      setLocalImage(url);
    });
  };

  const openMintModal = () => {
    setSketchPaused(true);
    getSketchBlob();
    setMintOpen(true);
  };

  const toggleSketchPaused = () => setSketchPaused(!sketchPaused);

  const toggleColorPicker = () => setColorPicker(!colorPicker);

  const handleColorChange = (color: ColorResult) => {
    setBgColor(color.hex);
    setColorPicker(false);
  };

  return (
    <div className="relative">
      {colorPicker && (
        <SwatchesPicker color={bgColor} onChangeComplete={handleColorChange} className="absolute bottom-14" />
      )}
      <div className="controlsContainer flex gap-2">
        <button className="gradientBG-2 py-4 px-6 mt-4 text-stone-50 text-left" onClick={toggleSketchPaused}>
          {sketchPaused ? <Play16 /> : <Pause16 />}
        </button>
        <button className="gradientBG-2 py-4 px-6 mt-4 text-stone-50 text-left" onClick={toggleColorPicker}>
          {<ColorPalette16 />}
        </button>
        <button
          className={`gradientBG py-3 px-6 mt-4 text-stone-50 text-left grow`}
          onClick={account ? openMintModal : () => setModalOpen('CONNECT')}
        >
          {account ? 'Mint Sketch' : 'Connect Wallet to Mint'}
        </button>
      </div>
      {sketchError && (
        <p className="text-stone-700 dark:text-stone-300 pt-4">{`SketchError: ${sketchError.name}: ${sketchError.message}`}</p>
      )}
    </div>
  );
}
