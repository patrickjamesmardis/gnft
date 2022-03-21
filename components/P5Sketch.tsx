import { useContext, useEffect } from 'react';
import { SketchContext } from '../context/Sketch';
import P5 from 'p5';

export default function P5Sketch() {
  const { setP5Instance, setSketchError } = useContext(SketchContext);

  useEffect(() => {
    new P5((p5: P5) => {
      setP5Instance(p5);
      p5.setup = () => {
        const c = p5.createCanvas(500, 500);
        c.parent('sketch');
        p5.background(0);
        p5.fill(255);
      };
      p5.draw = () => {
        try {
          window.drawFunc(p5);
        } catch (error) {
          setSketchError(error);
          window.drawFunc = () => { };
        }
      };
    });

    return function cleanup() {
      document.querySelectorAll('canvas').forEach((c) => c.remove());
    };
  }, []);

  return <div id="sketch"></div>;
}
