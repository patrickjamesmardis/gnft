import { createContext, Dispatch, SetStateAction, useEffect, useState } from 'react';
import { parse } from '@babel/parser';
import { Editor } from 'brace';
import shortHash from 'shorthash2';
import type P5 from 'p5';
import { compileCode } from '@nx-js/compiler-util';

declare global {
  interface Window {
    drawFunc: string;
  }
}

export type EditorBlock = {
  code: string;
  id: string;
  editor?: Editor;
};

type SketchContext = {
  addedBlocks: number;
  bgColor: string;
  draw: string;
  editorBlocks: EditorBlock[];
  setAddedBlocks: Dispatch<SetStateAction<number>>;
  setBgColor: Dispatch<SetStateAction<string>>;
  setDraw: Dispatch<SetStateAction<string>>;
  setEditorBlocks: Dispatch<SetStateAction<EditorBlock[]>>;
  setP5Instance: Dispatch<SetStateAction<P5>>;
  setSketchDescription: Dispatch<SetStateAction<string>>;
  setSketchError: Dispatch<SetStateAction<any>>;
  setSketchPaused: Dispatch<SetStateAction<boolean>>;
  setSketchTitle: Dispatch<SetStateAction<string>>;
  sketchDescription: string;
  sketchError: any;
  sketchPaused: boolean;
  sketchTitle: string;
};
export const SketchContext = createContext<SketchContext | null>(null);

export const rn = (max: number) => (Math.floor(Math.random() * max) + 1).toString();
export const createId = (idx: number) => {
  return `be-${shortHash(`braceEditor-${idx}-${Date.now()}`)}`;
};

const defaultBlocks = [
  {
    code: `const color_speed = ${rn(30)};\nconst rotate_speed = ${rn(
      40
    )};\np5.colorMode(p5.HSB, 100);\np5.stroke(p5.frameCount / color_speed % 100, 100, 100, 60);\np5.noFill();\np5.translate(p5.width / 2, p5.height / 2);\np5.rotate(p5.radians(p5.frameCount * rotate_speed));\n`,
    id: createId(0),
  },
  {
    code: `const rectX = ${rn(150)};\nconst rectY = ${rn(150)};\nconst rectW = ${rn(150)};\nconst rectH = ${rn(
      150
    )};\np5.rect(rectX, rectY, rectW, rectH);\n`,
    id: createId(1),
  },
  {
    code: `const triX1 = ${rn(150)};\nconst triY1 = ${rn(150)};\nconst triX2 = ${rn(150)};\nconst triY2 = ${rn(
      150
    )};\nconst triX3 = ${rn(150)};\nconst triY3 = ${rn(
      150
    )};\np5.triangle(triX1, triY1, triX2, triY2, triX3, triY3);\n`,
    id: createId(2),
  },
  {
    code: `const circleX = ${rn(150)};\nconst circleY = ${rn(150)};\nconst circleD = ${rn(
      150
    )};\np5.circle(circleX, circleY, circleD);\n`,
    id: createId(3),
  },
];

const defaultDraw = defaultBlocks.reduce((partial, current) => `${partial}\n${current.code}`, '');

const Sketch = ({ children }) => {
  const [addedBlocks, setAddedBlocks] = useState(0);
  const [draw, setDraw] = useState(defaultDraw);
  const [editorBlocks, setEditorBlocks] = useState<EditorBlock[]>(defaultBlocks);
  const [p5Instance, setP5Instance] = useState<P5>(null);
  const [pauseFrameCount, setPauseFrameCount] = useState(0);
  const [sketchDescription, setSketchDescription] = useState('created at g-nft.app');
  const [sketchError, setSketchError] = useState(null);
  const [sketchPaused, setSketchPaused] = useState(false);
  const [sketchTitle, setSketchTitle] = useState('GNFT Sketch');
  const [bgColor, setBgColor] = useState('#000000');

  useEffect(() => {
    if (!window.drawFunc) {
      window.drawFunc = defaultDraw;
    }
  }, []);

  useEffect(() => {
    if (p5Instance) {
      p5Instance.frameCount = 0;
      p5Instance.background(0);
    }
    try {
      parse(draw, { errorRecovery: true });
      window.drawFunc = draw;
      setSketchError(null);
    } catch (error) {
      setSketchError(error);
      window.drawFunc = '';
    }
  }, [draw]);

  useEffect(() => {
    if (p5Instance) {
      if (sketchPaused) {
        setPauseFrameCount(p5Instance.frameCount);
        p5Instance.draw = () => {};
      } else {
        p5Instance.frameCount = pauseFrameCount;
        p5Instance.draw = () => {
          try {
            const code = compileCode(window.drawFunc);
            code({ p5: p5Instance });
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

  useEffect(() => {
    if (bgColor && p5Instance) {
      p5Instance.background(bgColor);
    }
  }, [bgColor]);

  const context: SketchContext = {
    addedBlocks,
    bgColor,
    draw,
    editorBlocks,
    setAddedBlocks,
    setBgColor,
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
    sketchTitle,
  };

  return <SketchContext.Provider value={context}>{children}</SketchContext.Provider>;
};

export default Sketch;
