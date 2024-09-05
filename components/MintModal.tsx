import { Dispatch, SetStateAction, useContext, useState, useEffect } from 'react';
import Image from 'next/image';
import { Button, ComposedModal, ModalHeader, ModalBody, ModalFooter, TextInput } from 'carbon-components-react';
import { SketchContext } from '../context/Sketch';

export default function MintModal({
  modalOpen,
  setModalOpen,
  localImage,
}: {
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  localImage: string;
}) {
  const { sketchTitle, setSketchPaused, setSketchTitle } = useContext(SketchContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!modalOpen) {
      setLoading(false);
      setError(false);
    }
  }, [modalOpen]);

  const saveSketch = async () => {
    setLoading(true);
    document.querySelector('canvas').toBlob(async b => {
      try {
        setLoading(true);
        const dataURL = document.querySelector('canvas').toDataURL('image/png');
        dataURL.replace(/^data:image\/png/, 'data:application/octet-stream');

        const link = document.createElement('a');
        link.download = (sketchTitle || 'p5 Sketch').replace(' ', '_') + '.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setLoading(false);
        setSketchPaused(false);
        setModalOpen(false);
      } catch (error) {
        setError(true);
        console.log(error);
      }
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => setSketchTitle(e.target.value);
  return (
    <ComposedModal
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
      preventCloseOnClickOutside={loading}
    >
      <ModalHeader label={`New p5 Sketch`} closeIconClassName="visible">
        <h1>Save your Sketch</h1>
      </ModalHeader>
      <ModalBody>
        {!error && (
          <>
            <p style={{ marginBottom: '1rem' }}>Give your sketch a name to download the paused frame.</p>
            <TextInput
              data-modal-primary-focus
              id="sketchTitle"
              labelText="Title"
              placeholder="GNFT Sketch"
              defaultValue={sketchTitle}
              style={{ marginBottom: '1rem' }}
              onChange={handleTitleChange}
            />
            {localImage && (
              <Image
                src={localImage}
                width={500}
                height={500}
                className="mintModalImage"
                alt="Paused frame from P5 sketch canvas"
                onLoad={() => {
                  URL.revokeObjectURL(localImage);
                }}
              />
            )}
          </>
        )}
        {error && (
          <>
            <p className="pt-4 pb-2">There was an error while saving your sketch.</p>
            <p>Please try again later</p>
          </>
        )}
      </ModalBody>

      <ModalFooter>
        <Button
          kind="secondary"
          onClick={() => {
            setModalOpen(false);
          }}
        >
          Cancel
        </Button>
        <Button
          kind="primary"
          onClick={saveSketch}
          disabled={loading}
          className={`gradientBG ${loading ? 'opacity-50 loading' : 'opacity-100'}`}
        >
          Save Sketch
        </Button>
      </ModalFooter>
    </ComposedModal>
  );
}
