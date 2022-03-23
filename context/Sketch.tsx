import { createContext, useEffect, useState } from 'react';
import { parse } from '@babel/parser';
import { Editor } from 'brace';
import shortHash from 'shorthash2';
import type P5 from 'p5';

declare global {
  interface Window { drawFunc: Function; }
};

export type EditorBlockType = {
  code: string,
  id: string,
  editor?: Editor,
};

type SketchContextType = {
  addedBlocks: number,
  draw: string,
  editorBlocks: EditorBlockType[],
  setAddedBlocks: React.Dispatch<React.SetStateAction<number>>,
  setDraw: React.Dispatch<React.SetStateAction<string>>,
  setEditorBlocks: React.Dispatch<React.SetStateAction<EditorBlockType[]>>,
  setP5Instance: React.Dispatch<React.SetStateAction<P5>>,
  setSketchDescription: React.Dispatch<React.SetStateAction<string>>,
  setSketchError: React.Dispatch<React.SetStateAction<any>>,
  setSketchPaused: React.Dispatch<React.SetStateAction<boolean>>,
  setSketchTitle: React.Dispatch<React.SetStateAction<string>>,
  sketchDescription: string,
  sketchError: any,
  sketchPaused: boolean,
  sketchTitle: string
};

export const SketchContext = createContext<SketchContextType | null>(null);

export const rn = (max: number) => (Math.floor(Math.random() * max) + 1).toString();
export const createId = (idx: number) => {
  return `be-${shortHash(`braceEditor-${idx}-${Date.now()}`)}`;
};

const defaultBlocks = [
  {
    code: `const color_speed = ${rn(30)};\nconst rotate_speed = ${rn(40)};\np5.colorMode(p5.HSB, 100);\np5.stroke(p5.frameCount / color_speed % 100, 100, 100, 60);\np5.noFill();\np5.translate(p5.width / 2, p5.height / 2);\np5.rotate(p5.radians(p5.frameCount * rotate_speed));\n`,
    id: createId(0),
  },
  {
    code: `const rectX = ${rn(150)};\nconst rectY = ${rn(150)};\nconst rectW = ${rn(150)};\nconst rectH = ${rn(150)};\np5.rect(rectX, rectY, rectW, rectH);\n`,
    id: createId(1),
  },
  {
    code: `const triX1 = ${rn(150)};\nconst triY1 = ${rn(150)};\nconst triX2 = ${rn(150)};\nconst triY2 = ${rn(150)};\nconst triX3 = ${rn(150)};\nconst triY3 = ${rn(150)};\np5.triangle(triX1, triY1, triX2, triY2, triX3, triY3);\n`,
    id: createId(2),
  },
  {
    code: `const circleX = ${rn(150)};\nconst circleY = ${rn(150)};\nconst circleD = ${rn(150)};\np5.circle(circleX, circleY, circleD);\n`,
    id: createId(3),
  },
];

const defaultDraw = defaultBlocks.reduce((partial, current) => `${partial}\n${current.code}`, '');
const drawFunc = new Function('p5', defaultDraw);

const Sketch = ({ children }) => {
  const [addedBlocks, setAddedBlocks] = useState(0);
  const [draw, setDraw] = useState(defaultDraw);
  const [editorBlocks, setEditorBlocks] = useState<EditorBlockType[]>(defaultBlocks);
  const [p5Instance, setP5Instance] = useState<P5>(null);
  const [pauseFrameCount, setPauseFrameCount] = useState(0);
  const [sketchDescription, setSketchDescription] = useState('created at g-nft.app');
  const [sketchError, setSketchError] = useState(null);
  const [sketchPaused, setSketchPaused] = useState(false);
  const [sketchTitle, setSketchTitle] = useState('GNFT Sketch');

  useEffect(() => {
    if (!window.drawFunc) {
      window.drawFunc = drawFunc;
    }
  }, []);

  useEffect(() => {
    if (p5Instance) {
      p5Instance.frameCount = 0;
      p5Instance.background(0);
    }
    try {
      parse(draw, { errorRecovery: true });
      window.drawFunc = new Function('p5', draw);
      setSketchError(null);
    } catch (error) {
      setSketchError(error);
      window.drawFunc = () => { };
    }
  }, [draw]);

  useEffect(() => {
    if (p5Instance) {
      if (sketchPaused) {
        setPauseFrameCount(p5Instance.frameCount);
        p5Instance.draw = () => { };
      } else {
        p5Instance.frameCount = pauseFrameCount;
        p5Instance.draw = () => {
          try {
            window.drawFunc(p5Instance);
            setSketchError(null);
          } catch (error) {
            setSketchError(error);
          }
        };
      }
    }
  }, [sketchPaused]);

  useEffect(() => {
    !sketchTitle && setSketchTitle('GNFT Sketch');
  }, [sketchTitle]);

  useEffect(() => {
    !sketchDescription && setSketchDescription('created at g-nft.app');
  }, [sketchDescription]);

  const context: SketchContextType = {
    addedBlocks,
    draw,
    editorBlocks,
    setAddedBlocks,
    setDraw,
    setEditorBlocks,
    setP5Instance,
    setSketchDescription,
    setSketchError,
    setSketchPaused,
    setSketchTitle,
    sketchDescription,
    sketchError,
    sketchPaused,
    sketchTitle
  };

  return <SketchContext.Provider value={context}>{children}</SketchContext.Provider>;
};

export default Sketch;
