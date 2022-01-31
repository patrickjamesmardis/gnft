import Head from 'next/head';
import dynamic from 'next/dynamic';

import Sketch from '../context/Sketch';
import P5Sketch from '../components/P5Sketch';
import SketchControls from '../components/SketchControls';

const Editor = dynamic(import('../components/Editor'), { ssr: false });

export default function Create() {
  return (
    <>
      <Head>
        <title>GNFT | Create</title>
        <meta name="description" content="Create, mint, and collect generative art NFTs." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Sketch>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 w-full pt-4">
          <div id="editorContainer" className="h-96 lg:h-full">
            <Editor />
          </div>
          <div id="sketchContainer">
            <P5Sketch />
          </div>
          <div></div>
          <div>
            <SketchControls />
          </div>
        </div>
      </Sketch>
    </>
  );
}
