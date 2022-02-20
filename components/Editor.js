import { useEffect, useContext } from 'react';
import ace from 'brace';
import 'brace/mode/javascript';
import 'brace/theme/github';

import { SketchContext } from '../context/Sketch';

export default function Editor() {
  const { setDraw, defaultDraw, sketchTitle, sketchDescription } = useContext(SketchContext);
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

  return (
    <>
      <h1 className="text-2xl pl-4 text-gradient">
        <span>
          {sketchTitle}
        </span>
      </h1>
      <p className="pl-4 pb-2 text-stone-900 dark:text-stone-50">
        {sketchDescription}
      </p>
      <div id="braceEditor" className="h-full"></div>
    </>
  );
}
