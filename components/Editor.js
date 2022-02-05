import { useContext } from 'react';

import { SketchContext } from '../context/Sketch';

import Block from './Block';

export default function Editor() {
  const { editorBlocks } = useContext(SketchContext);

  return (
    <>
      {editorBlocks.map((block) => (
        <Block key={block.id} block={block} />
      ))}
    </>
  );
}
