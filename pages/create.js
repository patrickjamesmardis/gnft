import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useContext } from 'react';

import P5Sketch from '../components/P5Sketch';
import SketchControls from '../components/SketchControls';
import MintModal from '../components/MintModal';
import { SketchContext } from '../context/Sketch';

const Editor = dynamic(import('../components/Editor'), { ssr: false });

export default function Create() {
  const { sketchTitle, sketchDescription } = useContext(SketchContext);
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
          <h1 className="text-2xl text-gradient"><span>{sketchTitle}</span></h1>
          <p className="text-stone-900 dark:text-stone-50">{sketchDescription}</p>
        </div>
        <div className="flex flex-wrap">
          <div className="editorContainer mt-4 lg:mt-0 order-2 lg:order-1">
            <Editor />
          </div>
          <div className="sketchContainer lg:pl-3 order-1 lg:order-2 lg:fixed lg:right-0">
            <P5Sketch />
            <SketchControls />
          </div>
        </div>
      </div>
      <MintModal />
    </>
  );
}
