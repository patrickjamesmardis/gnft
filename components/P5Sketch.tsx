import { useContext, useEffect } from 'react';
import { SketchContext } from '../context/Sketch';
import P5 from 'p5';
import { compileCode } from '@nx-js/compiler-util';

export default function P5Sketch() {
  const { bgColor, setP5Instance, setSketchError } = useContext(SketchContext);

  useEffect(() => {
    new P5((p5: P5) => {
      setP5Instance(p5);
      p5.setup = () => {
        const c = p5.createCanvas(500, 500);
        c.parent('sketch');
        p5.background(bgColor);
        p5.fill(255);
      };
      p5.draw = () => {
        try {
          const code = compileCode(window.drawFunc);
          code({ p5 });
        } catch (error) {
          setSketchError(error);
          window.drawFunc = '';
        }
      };
    });

    return function cleanup() {
      document.querySelectorAll('canvas').forEach(c => c.remove());
    };
  }, []);

  return <div id="sketch"></div>;
}
