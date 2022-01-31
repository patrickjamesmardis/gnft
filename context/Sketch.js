import { createContext, useContext, useEffect, useState } from 'react';
import { parse } from '@babel/parser';
import { WalletContext } from './Wallet';

export const SketchContext = createContext();

const rn = (max) => (Math.floor(Math.random() * max) + 1).toString();
const defaultDraw = `const color_speed = ${rn(30)};\nconst rotate_speed = ${rn(
  40
)};\np5.colorMode(p5.HSB, 100);\np5.stroke(p5.frameCount / color_speed % 100, 100, 100, 60);\np5.noFill();\np5.translate(p5.width / 2, p5.height / 2);\np5.rotate(p5.radians(p5.frameCount * rotate_speed));\np5.rect(${rn(
  150
)}, ${rn(150)}, ${rn(150)}, ${rn(150)});\np5.triangle(${rn(150)}, ${rn(150)}, ${rn(150)}, ${rn(150)}, ${rn(150)}, ${rn(
  150
)});\np5.circle(${rn(150)}, ${rn(150)}, ${rn(150)});`;
const drawFunc = new Function('p5', defaultDraw);

const Sketch = ({ children }) => {
  const [p5Instance, setP5Instance] = useState(null);
  const [draw, setDraw] = useState(defaultDraw);
  const [sketchError, setSketchError] = useState(null);
  const [sketchPaused, setSketchPaused] = useState(false);
  const [pauseFrameCount, setPauseFrameCount] = useState(0);
  const [imageUrl, setImageUrl] = useState(null);
  const [sketchTitle, setSketchTitle] = useState(null);
  const [sketchDescription, setSketchDescription] = useState(null);
  const { client, setIsMinting, currentAccount, setIpfsUrl, setMintStatus } = useContext(WalletContext);

  useEffect(() => {
    window.drawFunc = drawFunc;
  }, []);

  useEffect(() => {
    if (p5Instance) {
      p5Instance.frameCount = 0;
      p5Instance.background(0);
    }

    try {
      parse(draw, { errorRecovery: true });
      window.drawFunc = new Function('p5', draw);
    } catch (error) {
      setSketchError(error);
      window.drawFunc = () => {};
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
            window.drawFunc(p5Instance);
          } catch (error) {
            setSketchError(error);
          }
        };
      }
    }
  }, [sketchPaused]);

  useEffect(() => {
    if (imageUrl) {
      console.log(imageUrl);
      const name = sketchTitle || 'GNFT Sketch';
      const description = sketchDescription || 'created at g-nft.app';
      addMetadata(JSON.stringify({ name, description, image: imageUrl, sourceCode: draw, artist: currentAccount }));
      setImageUrl(null);
    }
  }, [imageUrl]);

  const addMetadata = async (file) => {
    try {
      const size = Buffer.byteLength(file);
      setMintStatus(`Uploading metadata to IFPS. (0 / ${size} B)`);
      const added = await client.add(file, {
        pin: true,
        prograss: (prog) => setMintStatus(`Uploading metadata to IFPS. (${prog} / ${size} B)`),
      });
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      setIpfsUrl(url);
    } catch (error) {
      setIsMinting(false);
      setMintStatus('Error uploading metadata to IPFS.');
      setTimeout(() => {
        setIsMinting(false);
        setMintStatus('Mint Sketch');
      }, 5000);
      console.log(error);
    }
  };

  const saveSketch = async () => {
    if (p5Instance) {
      setMintStatus('Uploading image to IPFS.');
      setIsMinting(true);
      document.querySelector('canvas').toBlob(async (b) => {
        try {
          const { size } = b;
          setMintStatus(`Uploading image to IPFS. (0 / ${size} B)`);
          const added = await client.add(b, {
            pin: true,
            progress: (prog) => setMintStatus(`Uploading image to IPFS. (${prog} / ${size} B)`),
          });
          const url = `https://ipfs.infura.io/ipfs/${added.path}`;
          setImageUrl(url);
        } catch (error) {
          setIsMinting(false);
          setMintStatus('Error uploading image to IPFS.');
          setTimeout(() => {
            setIsMinting(false);
            setMintStatus('Mint Sketch');
          }, 5000);
          console.log(error);
        }
      });
    }
  };

  const context = {
    setP5Instance,
    setDraw,
    setSketchError,
    defaultDraw,
    sketchPaused,
    setSketchPaused,
    saveSketch,
    setSketchTitle,
    setSketchDescription,
  };

  return <SketchContext.Provider value={context}>{children}</SketchContext.Provider>;
};

export default Sketch;
