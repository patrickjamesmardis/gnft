import { createContext, useContext, useEffect, useState } from 'react';
import { parse } from '@babel/parser';
import { WalletContext } from './Wallet';

export const SketchContext = createContext();

const rn = (max) => (Math.floor(Math.random() * max) + 1).toString();
const defaultDraw = `function setup() {\n\tp5.background(0);\n\tp5.fill(255);\n}\n\nfunction draw() {\n\tconst color_speed = ${rn(30)};\n\tconst rotate_speed = ${rn(40)};\n\tp5.colorMode(p5.HSB, 100);\n\tp5.stroke(p5.frameCount / color_speed % 100, 100, 100, 60);\n\tp5.noFill();\n\tp5.translate(p5.width / 2, p5.height / 2);\n\tp5.rotate(p5.radians(p5.frameCount * rotate_speed));\n\tp5.rect(${rn(150)}, ${rn(150)}, ${rn(150)}, ${rn(150)});\n\tp5.triangle(${rn(150)}, ${rn(150)}, ${rn(150)}, ${rn(150)}, ${rn(150)}, ${rn(150)});\n\tp5.circle(${rn(150)}, ${rn(150)}, ${rn(150)});\n}`;

const Sketch = ({ children }) => {
  const [p5Instance, setP5Instance] = useState(null);
  const [draw, setDraw] = useState(defaultDraw);
  const [sketchError, setSketchError] = useState(null);
  const [sketchPaused, setSketchPaused] = useState(false);
  const [pauseFrameCount, setPauseFrameCount] = useState(0);
  const [imageUrl, setImageUrl] = useState(null);
  const [sketchTitle, setSketchTitle] = useState('GNFT Sketch');
  const [sketchDescription, setSketchDescription] = useState('created at g-nft.app');
  const [localImage, setLocalImage] = useState(null);
  const { client, setIsMinting, currentAccount, setIpfsUrl, setMintStatus, mintModalOpen, setMintModalOpen } = useContext(WalletContext);

  const parseCode = code => {
    const ast = parse(code, { errorRecovery: true });
    const setupBodyNode = ast.program.body[0].body.body;
    const drawBodyNode = ast.program.body[1].body.body;
    const getBody = (nodes) => code.split('\n').slice(nodes[0].loc.start.line - 1, nodes[nodes.length - 1].loc.end.line).join('\n').trim();
    const setupBody = getBody(setupBodyNode);
    const drawBody = getBody(drawBodyNode);
    return { setupFunction: setupBody, drawFunction: drawBody }
  }

  useEffect(() => {
    const { setupFunction, drawFunction } = parseCode(defaultDraw);
    window.setupFunc = new Function('p5', setupFunction);
    window.drawFunc = new Function('p5', drawFunction);
  }, []);

  useEffect(() => {
    if (p5Instance) {
      p5Instance.frameCount = 0;
      p5Instance.background(0);
    }

    try {
      const { setupFunction, drawFunction } = parseCode(draw);

      window.setupFunc = new Function('p5', setupFunction);
      window.drawFunc = new Function('p5', drawFunction);
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
          } catch (error) {
            setSketchError(error);
          }
        };
      }
    }
  }, [sketchPaused]);

  useEffect(() => {
    if (imageUrl) {
      const name = sketchTitle || 'GNFT Sketch';
      const description = sketchDescription || 'created at g-nft.app';
      addMetadata(JSON.stringify({ name, description, image: imageUrl, sourceCode: draw, artist: currentAccount }));
      setImageUrl(null);
    }
  }, [imageUrl]);

  useEffect(() => {
    !sketchTitle && setSketchTitle('GNFT Sketch');
  }, [sketchTitle]);

  useEffect(() => {
    !sketchDescription && setSketchDescription('created at g-nft.app');
  }, [sketchDescription]);

  useEffect(() => { console.log(sketchError) }, [sketchError]);

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
        setMintModalOpen(false);
      }, 5000);
      console.log(error);
    }
  };

  const getSketchBlob = () => {
    if (p5Instance) {
      if (localImage) {
        URL.revokeObjectURL(localImage);
      }

      document.querySelector('canvas').toBlob(b => {
        const url = URL.createObjectURL(b);
        setLocalImage(url);
      });
    }
  };

  const openMintModal = () => {
    setSketchPaused(true);
    getSketchBlob();
    setMintModalOpen(true);
  }

  const saveSketch = async () => {
    if (p5Instance) {
      setMintStatus('Uploading image to IPFS.');
      setIsMinting(true);
      document.querySelector('canvas').toBlob(async b => {
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
            setMintModalOpen(false);
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
    sketchTitle,
    setSketchTitle,
    sketchDescription,
    setSketchDescription,
    openMintModal,
    localImage
  };

  return <SketchContext.Provider value={context}>{children}</SketchContext.Provider>;
};

export default Sketch;
