import { useContext } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';

import Sketch from '../context/Sketch';
import P5Sketch from '../components/P5Sketch';
import SketchControls from '../components/SketchControls';

import { WalletContext } from '../context/Wallet';

const Editor = dynamic(import('../components/Editor'), { ssr: false });

export default function Create() {
  const { mintStatus } = useContext(WalletContext);
  return (
    <>
      <Head>
        <title>GNFT | Create</title>
        <meta name="description" content="Create, mint, and collect generative art NFTs." />
        <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Sketch>
        <div className="flex flex-wrap bg-stone-50 dark:bg-stone-900">
          <SketchControls />
          <div
            className={`editorContainer order-2 lg:order-1 mt-6 lg:mt-16 ${
              mintStatus === 'Mint sketch' ? 'lg:pt-4' : 'lg:pt-10'
            }`}
          >
            <Editor />
          </div>
          <div className={`sketchContainer lg:pt-4 lg:pl-3 order-1 lg:order-2`}>
            <P5Sketch />
          </div>
        </div>
      </Sketch>
    </>
  );
}
