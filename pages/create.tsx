import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useContext, useEffect, useState } from 'react';

import SketchControls from '../components/SketchControls';
import MintModal from '../components/MintModal';
import { SketchContext } from '../context/Sketch';

const Editor = dynamic(import('../components/Editor'), { ssr: false });
const P5Sketch = dynamic(import('../components/P5Sketch'), { ssr: false });

export default function Create() {
  const { sketchTitle, sketchDescription } = useContext(SketchContext);
  const [supportedBrowser, setSupportedBrowser] = useState(true);
  const [mintModalOpen, setMintModalOpen] = useState(false);
  const [localImage, setLocalImage] = useState(null);

  useEffect(() => {
    setSupportedBrowser(MediaRecorder.isTypeSupported('video/webm'));
  }, []);

  return (
    <>
      <Head>
        <title>GNFT | Create</title>
        <meta name="description" content="Create, mint, and collect generative art NFTs." />
        <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="pb-4">
        <div className="px-4 pt-4 pb-4 text-stone-900 dark:text-stone-50">
          <h1 className="text-2xl text-gradient">
            <span>{supportedBrowser ? sketchTitle : 'Unsupported Browser'}</span>
          </h1>
          {supportedBrowser && <p className="text-stone-900 dark:text-stone-50">{sketchDescription}</p>}
        </div>
        {supportedBrowser && (
          <div className="flex flex-wrap">
            <div className="editorContainer mt-4 lg:mt-0 order-2 lg:order-1">
              <Editor />
            </div>
            <div className="sketchContainer lg:pl-3 order-1 lg:order-2 lg:fixed lg:right-0">
              <P5Sketch />
              <SketchControls setMintOpen={setMintModalOpen} setLocalImage={setLocalImage} />
            </div>
          </div>
        )}
      </div>
      {supportedBrowser && (
        <MintModal modalOpen={mintModalOpen} setModalOpen={setMintModalOpen} localImage={localImage} />
      )}
    </>
  );
}
