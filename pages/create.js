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
        <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Sketch>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 pt-4">
          <div className="h-96 lg:h-full editorContainer" style={{ marginBottom: '80px' }}>
            <Editor />
          </div>
          <div className="sketchContainer">
            <P5Sketch />
          </div>
          <div></div>
          <div className="controlsContainer">
            <SketchControls />
          </div>
        </div>
      </Sketch>
    </>
  );
}
