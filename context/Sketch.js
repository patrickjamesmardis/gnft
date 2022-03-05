import { createContext, useContext, useEffect, useState } from 'react';
import { parse } from '@babel/parser';
import { WalletContext } from './Wallet';
import shortHash from 'shorthash2';

export const SketchContext = createContext();

const rn = (max) => (Math.floor(Math.random() * max) + 1).toString();
const createId = (idx) => {
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
  const [p5Instance, setP5Instance] = useState(null);
  const [draw, setDraw] = useState(defaultDraw);
  const [sketchError, setSketchError] = useState(null);
  const [sketchPaused, setSketchPaused] = useState(false);
  const [pauseFrameCount, setPauseFrameCount] = useState(0);
  const [imageUrl, setImageUrl] = useState(null);
  const [sketchTitle, setSketchTitle] = useState('GNFT Sketch');
  const [sketchDescription, setSketchDescription] = useState('created at g-nft.app');
  const [localImage, setLocalImage] = useState(null);
  const [editorBlocks, setEditorBlocks] = useState(defaultBlocks);
  const [addedBlocks, setAddedBlocks] = useState(0);
  const { client, setIsMinting, currentAccount, setIpfsUrl, setMintStatus, setMintModalOpen } = useContext(WalletContext);

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
    if (imageUrl) {
      const name = sketchTitle || 'GNFT Sketch';
      const description = sketchDescription || 'created at g-nft.app';
      addMetadata(JSON.stringify({ name, description, image: imageUrl, sourceCode: draw.trim(), artist: currentAccount }));
      setImageUrl(null);
    }
  }, [imageUrl]);

  useEffect(() => {
    !sketchTitle && setSketchTitle('GNFT Sketch');
  }, [sketchTitle]);

  useEffect(() => {
    !sketchDescription && setSketchDescription('created at g-nft.app');
  }, [sketchDescription]);

  const addMetadata = async (file) => {
    try {
      const size = Buffer.byteLength(file);
      setMintStatus(`Uploading metadata to IFPS. (0 / ${size} B)`);
      const added = await client.add(file, {
        pin: true,
        progress: (prog) => setMintStatus(`Uploading metadata to IFPS. (${prog} / ${size} B)`),
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
    sketchError,
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
    localImage,
    editorBlocks,
    setEditorBlocks,
    createId,
    rn,
    addedBlocks,
    setAddedBlocks
  };

  return <SketchContext.Provider value={context}>{children}</SketchContext.Provider>;
};

export default Sketch;
