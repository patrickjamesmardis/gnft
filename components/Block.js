import { Add16 } from '@carbon/icons-react';
import { useContext, useEffect, useState } from 'react';

import ace from 'brace';
import 'brace/mode/javascript';
import 'brace/theme/github';

import { SketchContext } from '../context/Sketch';

export default function Block({ block }) {
  const { editorBlocks, setEditorBlocks, setDraw, createId, rn, addedBlocks, setAddedBlocks } =
    useContext(SketchContext);
  const [addOpen, setAddOpen] = useState(false);

  const getCurrentIndex = () => editorBlocks.findIndex((b) => b.id === block.id);

  const updateDraw = () => {
    const fullFunction = editorBlocks.reduce((partial, current) => `${partial}\n${current.code}`, '');
    setDraw(fullFunction);
  };

  const updateBlock = (code, editor, id) => {
    const blocks = editorBlocks;
    const currIdx = getCurrentIndex();
    blocks.splice(currIdx, 1, { code, editor, id });
    setEditorBlocks(blocks);
  };

  const updateHeight = (editor, id) => {
    const h = (editor.getSession().getScreenLength() + 1) * editor.renderer.lineHeight;
    document.getElementById(id).style.height = `${h}px`;
    editor.resize();
  };

  const handleEditorChange = (editor, id) => {
    editor.$blockScrolling = Infinity;
    updateBlock(editor.getValue(), editor, id);
    updateDraw();
    updateHeight(editor, id);
  };

  const focusOnNext = () => {
    const currIdx = getCurrentIndex();
    if (currIdx < editorBlocks.length - 1) {
      editorBlocks[currIdx + 1].editor.focus();
    }
  };

  const setupEditor = () => {
    const { id, code } = block;
    const editor = ace.edit(id);
    editor.$blockScrolling = Infinity;
    editor.getSession().setMode('ace/mode/javascript');
    editor.setTheme('ace/theme/github');
    editor.getSession().setValue(code);
    editor.setOption('showPrintMargin', false);
    const h = (editor.getSession().getScreenLength() + 1) * editor.renderer.lineHeight;
    document.getElementById(id).style.height = `${h}px`;
    editor.resize();
    editor.getSession().on('change', () => {
      handleEditorChange(editor, id);
    });
    editor.commands.addCommand({
      name: 'nextBlock',
      bindKey: 'Shift-Tab',
      exec: () => {
        focusOnNext();
      },
    });
    updateBlock(block.code, editor, id);
  };

  useEffect(() => {
    setupEditor();
  }, []);

  const toggleAdd = () => {
    setAddOpen(!addOpen);
  };

  const handleAdd = (code, id) => {
    const blocks = editorBlocks;
    const currIdx = getCurrentIndex();
    blocks.splice(currIdx + 1, 0, { code, id });
    setEditorBlocks(blocks);
    setAddedBlocks(addedBlocks + 1);
    updateDraw();
  };

  const addRectangle = () => {
    const currIdx = getCurrentIndex();
    const id = createId(currIdx + 1);
    const varId = addedBlocks + 1;
    const code = `const rectX_${varId} = ${rn(150)};\nconst rectY_${varId} = ${rn(150)};\nconst rectW_${varId} = ${rn(
      150
    )};\nconst rectH_${varId} = ${rn(
      150
    )};\np5.rect(rectX_${varId}, rectY_${varId}, rectW_${varId}, rectH_${varId});\n`;
    setAddOpen(false);
    handleAdd(code, id);
  };

  const addCircle = () => {
    const currIdx = getCurrentIndex();
    const id = createId(currIdx + 1);
    const varId = addedBlocks + 1;
    const code = `const circleX_${varId} = ${rn(150)};\nconst circleY_${varId} = ${rn(
      150
    )};\nconst circleD_${varId} = ${rn(150)};\np5.circle(circleX_${varId}, circleY_${varId}, circleD_${varId});\n`;
    setAddOpen(false);
    handleAdd(code, id);
  };

  const addTriangle = () => {
    const currIdx = getCurrentIndex();
    const id = createId(currIdx + 1);
    const varId = addedBlocks + 1;
    const code = `const triX1_${varId} = ${rn(150)};\nconst triY1_${varId} = ${rn(150)};\nconst triX2_${varId} = ${rn(
      150
    )};\nconst triY2_${varId} = ${rn(150)};\nconst triX3_${varId} = ${rn(150)};\nconst triY3_${varId} = ${rn(
      150
    )};\np5.triangle(triX1_${varId}, triY1_${varId}, triX2_${varId}, triY2_${varId}, triX3_${varId}, triY3_${varId});\n`;
    setAddOpen(false);
    handleAdd(code, id);
  };

  return (
    <div className="flex flex-wrap mb-2 blockContainer">
      <div id={block.id} className="editor order-1 lg:order-2 flex-none"></div>
      <button
        className="py-4 px-4 text-stone-700 dark:text-stone-50 self-end addBlock editorButton order-2 lg:order-1"
        onClick={toggleAdd}
      >
        <Add16 className={addOpen ? 'add-open' : 'add-closed'} />
      </button>
      {addOpen && (
        <div className="order-3 lg:px-12">
          <button className="py-4 px-4 editorButton" onClick={addRectangle}>
            <div className="w-4 h-4 border border-solid border-stone-700 dark:border-stone-50"></div>
          </button>
          <button className="py-4 px-4 editorButton" onClick={addCircle}>
            <div className="w-4 h-4 border border-solid border-stone-700 dark:border-stone-50 rounded-full"></div>
          </button>
          <button className="py-4 px-4 text-stone-700 dark:text-stone-50 editorButton" onClick={addTriangle}>
            <svg height="16" width="16" className="fill-transparent stroke-stone-700 dark:stroke-stone-50 stroke-1">
              <polygon points="0, 0, 16, 0, 8, 16"></polygon>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
