import { useEffect, useContext } from 'react';
import ace from 'brace';
import 'brace/mode/javascript';
import 'brace/theme/github';

import { SketchContext } from '../context/Sketch';

export default function Editor() {
  const { setDraw, defaultDraw, setSketchTitle, setSketchDescription } = useContext(SketchContext);
  useEffect(() => {
    const e = ace.edit('braceEditor');
    e.getSession().setMode('ace/mode/javascript');
    e.setTheme('ace/theme/github');
    e.$blockScrolling = Infinity;
    e.getSession().setValue(defaultDraw);
    e.getSession().on('change', () => {
      setDraw(e.getValue());
    });
  }, []);

  const handleTitleChange = (e) => {
    setSketchTitle(e.target.innerHTML);
  };
  const handleDescriptionChange = (e) => {
    setSketchDescription(e.target.innerHTML);
  };
  return (
    <>
      <h1 className="text-2xl pl-4 text-gradient">
        <span contentEditable="true" onBlur={handleTitleChange} suppressContentEditableWarning={true}>
          GNFT Sketch
        </span>
      </h1>
      <p className="pl-4 pb-2 text-stone-900 dark:text-stone-50">
        <span contentEditable="true" onBlur={handleDescriptionChange} suppressContentEditableWarning={true}>
          created at g-nft.app
        </span>
      </p>
      <div id="braceEditor" className="h-full"></div>
    </>
  );
}
