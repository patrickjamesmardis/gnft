import { useContext, useEffect } from 'react';
import { SketchContext } from '../context/Sketch';

export default function P5Sketch() {
  const { setP5Instance, setSketchError } = useContext(SketchContext);

  useEffect(() => {
    const P5 = require('p5');
    new P5((p5) => {
      setP5Instance(p5);
      p5.setup = () => {
        const c = p5.createCanvas(500, 500);
        c.parent('sketch');
        try {
          window.setupFunc(p5);
        } catch (error) {
          setSketchError(error);
          window.setupFunc = () => { };
        }
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

  return <div id="sketch" className="lg:fixed"></div>;
}
