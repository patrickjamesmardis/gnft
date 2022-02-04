import Head from 'next/head';
import dynamic from 'next/dynamic';

import Sketch from '../context/Sketch';
import P5Sketch from '../components/P5Sketch';
import MintStatus from '../components/MintStatus';

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
        <div className="flex flex-wrap pt-4">
          <div id="mintStatus" style={{ width: 'calc(100vw - 48px)' }}>
            <MintStatus />
          </div>
          <div className="editorContainer">
            <Editor />
          </div>
          <div className="sketchContainer pt-3 lg:pt-0 lg:pl-3">
            <P5Sketch />
          </div>
        </div>
      </Sketch>
    </>
  );
}
