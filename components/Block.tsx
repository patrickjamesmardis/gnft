import { Add16, Subtract16 } from '@carbon/icons-react';
import { useContext, useEffect, useState } from 'react';
import { parse } from '@babel/parser';
import { Expression, IfStatement, Node, VariableDeclaration } from '@babel/types';
import { Slider } from 'carbon-components-react';

import ace from 'brace';
import 'brace/mode/javascript';
import 'brace/theme/github';

import { EditorBlock, SketchContext, createId, rn } from '../context/Sketch';

type Env = {
  vars: { [key: string]: { value: number; line: number } };
  updatedText: string;
  charShift: number;
  editorCharShift: number;
  scopePath: string[];
};

const readStatement = (env: Env, statement: Node) => {
  if (statement.type === 'VariableDeclaration') {
    return processVariableDeclaration(env, statement);
  } else if (statement.type === 'ExpressionStatement') {
    return processExpression(env, statement.expression);
  } else if (statement.type === 'IfStatement') {
    return processIfStatement(env, statement);
  } else if (statement.type === 'FunctionDeclaration') {
    return readStatement(env, statement.body);
  } else if (statement.type === 'BlockStatement') {
    return statement.body.reduce(readStatement, { ...env });
  } else return { ...env };
};

const processVariableDeclaration = (env: Env, statement: VariableDeclaration) => {
  const declaration = statement.declarations[0];
  if (declaration && statement.declarations.length === 1 && declaration.id.type === 'Identifier') {
    const line = statement.loc.start.line;
    const name = declaration.id.name;
    if (declaration.init.type === 'NumericLiteral') {
      const { value } = declaration.init;
      return { ...env, vars: { ...env.vars, [name]: { value, line } } };
    } else if (
      declaration.init.type === 'UnaryExpression' &&
      declaration.init.operator === '-' &&
      declaration.init.argument.type === 'NumericLiteral'
    ) {
      const value = declaration.init.argument.value * -1;
      return { ...env, vars: { ...env.vars, [name]: { value, line } } };
    } else return { ...env };
  } else return { ...env };
};

const processExpression = (env: Env, expression: Expression) => {
  if (expression.type === 'CallExpression') {
    const args = expression.arguments;
    return args.reduce(readStatement, { ...env });
  } else return { ...env };
};

const processIfStatement = (env: Env, statement: IfStatement) => {
  const { updatedText } = readStatement(env, statement.test);
  let _env = { ...env, updatedText: updatedText };

  _env.scopePath.push(`if${statement.consequent.loc.start.line}`);
  const env1 = readStatement(_env, statement.consequent);
  _env.scopePath.pop();
  if (statement.alternate) {
    _env.scopePath.push(`else${statement.alternate.loc.start.line}`);
    const env2 = readStatement(_env, statement.alternate);
    _env.scopePath.pop();
    let path2 = env2.scopePath;
    path2.pop();
    return { ...env, ...env1, ...env2, vars: { ...env.vars, ...env1.vars, ...env2.vars }, scopePath: path2 };
  } else {
    let path1 = env1.scopePath;
    path1.pop();
    return { ...env, ...env1, vars: { ...env.vars, ...env1.vars }, scopePath: path1 };
  }
};

type Block = {
  code: (varId: number) => string;
  icon: JSX.Element;
};

const blocks: { [key: string]: Block } = {
  arc: {
    code: varId =>
      `const arcX_${varId} = ${rn(150)};\nconst arcY_${varId} = ${rn(150)};\nconst arcW_${varId} = ${rn(
        150
      )};\nconst arcH_${varId} = ${rn(150)};\nconst arcStart_${varId} = ${rn(7)};\nconst arcStop_${varId} = ${rn(
        7
      )};\np5.arc(arcX_${varId}, arcY_${varId}, arcW_${varId}, arcH_${varId}, arcStart_${varId}, arcStop_${varId});\n`,
    icon: (
      <svg height="16" width="16" className="fill-transparent stroke-stone-700 dark:stroke-stone-50 stroke-1">
        <path d="M 0 4 C 0 16, 16 16, 16 4" />
      </svg>
    ),
  },
  ellipse: {
    code: varId =>
      `const ellipseX_${varId} = ${rn(150)};\nconst ellipseY_${varId} = ${rn(150)};\nconst ellipseW_${varId} = ${rn(
        150
      )};\nconst ellipseH_${varId} = ${rn(
        150
      )};\np5.ellipse(ellipseX_${varId}, ellipseY_${varId}, ellipseW_${varId}, ellipseH_${varId});\n`,
    icon: <div className="w-2 h-4 border border-solid border-stone-700 dark:border-stone-50 rounded-full"></div>,
  },
  circle: {
    code: varId =>
      `const circleX_${varId} = ${rn(150)};\nconst circleY_${varId} = ${rn(150)};\nconst circleD_${varId} = ${rn(
        150
      )};\np5.circle(circleX_${varId}, circleY_${varId}, circleD_${varId});\n`,
    icon: <div className="w-4 h-4 border border-solid border-stone-700 dark:border-stone-50 rounded-full"></div>,
  },
  line: {
    code: varId =>
      `const lineX1_${varId} = ${rn(150)};\nconst lineY1_${varId} = ${rn(150)};\nconst lineX2_${varId} = ${rn(
        150
      )};\nconst lineY2_${varId} = ${rn(
        150
      )};\np5.line(lineX1_${varId}, lineY1_${varId}, lineX2_${varId}, lineY2_${varId});\n`,
    icon: (
      <svg height="16" width="16" className="fill-transparent stroke-stone-700 dark:stroke-stone-50 stroke-1">
        <line x1="0" y1="16" x2="16" y2="0" />
      </svg>
    ),
  },
  point: {
    code: varId =>
      `const pointX_${varId} = ${rn(150)};\nconst pointY_${varId} = ${rn(
        150
      )};\np5.point(pointX_${varId}, pointY_${varId});\n`,
    icon: (
      <svg
        height="16"
        width="16"
        className="fill-stone-700 dark:fill-stone-50 stroke-stone-700 dark:stroke-stone-50 stroke-1"
      >
        <circle cx="8" cy="8" r="2" />
      </svg>
    ),
  },
  quad: {
    code: varId =>
      `const quadX1_${varId} = ${rn(150)};\nconst quadY1_${varId} = ${rn(150)};\nconst quadX2_${varId} = ${rn(
        150
      )};\nconst quadY2_${varId} = ${rn(150)};\nconst quadX3_${varId} = ${rn(150)};\nconst quadY3_${varId} = ${rn(
        150
      )};\nconst quadX4_${varId} = ${rn(150)};\nconst quadY4_${varId} = ${rn(
        150
      )};\np5.quad(quadX1_${varId}, quadY1_${varId}, quadX2_${varId}, quadY2_${varId}, quadX3_${varId}, quadY3_${varId}, quadX4_${varId}, quadY4_${varId});\n`,
    icon: (
      <svg height="16" width="16" className="fill-transparent stroke-stone-700 dark:stroke-stone-50 stroke-1">
        <polygon points="0, 0, 16, 0, 8, 16, 0, 16"></polygon>
      </svg>
    ),
  },
  rectangle: {
    code: varId =>
      `const rectX_${varId} = ${rn(150)};\nconst rectY_${varId} = ${rn(150)};\nconst rectW_${varId} = ${rn(
        150
      )};\nconst rectH_${varId} = ${rn(
        150
      )};\np5.rect(rectX_${varId}, rectY_${varId}, rectW_${varId}, rectH_${varId});\n`,
    icon: <div className="w-2 h-4 border border-solid border-stone-700 dark:border-stone-50"></div>,
  },
  square: {
    code: varId =>
      `const squareX_${varId} = ${rn(150)};\nconst squareY_${varId} = ${rn(150)};\nconst squareS_${varId} = ${rn(
        150
      )};\np5.square(squareX_${varId}, squareY_${varId}, squareS_${varId});\n`,
    icon: <div className="w-4 h-4 border border-solid border-stone-700 dark:border-stone-50"></div>,
  },
  triangle: {
    code: varId =>
      `const triX1_${varId} = ${rn(150)};\nconst triY1_${varId} = ${rn(150)};\nconst triX2_${varId} = ${rn(
        150
      )};\nconst triY2_${varId} = ${rn(150)};\nconst triX3_${varId} = ${rn(150)};\nconst triY3_${varId} = ${rn(
        150
      )};\np5.triangle(triX1_${varId}, triY1_${varId}, triX2_${varId}, triY2_${varId}, triX3_${varId}, triY3_${varId});\n`,
    icon: (
      <svg height="16" width="16" className="fill-transparent stroke-stone-700 dark:stroke-stone-50 stroke-1">
        <polygon points="0, 0, 16, 0, 8, 16"></polygon>
      </svg>
    ),
  },
};

export default function Block({ block }: { block: EditorBlock }) {
  const { editorBlocks, setEditorBlocks, setDraw, addedBlocks, setAddedBlocks, setSketchError } =
    useContext(SketchContext);
  const [addOpen, setAddOpen] = useState(false);
  const [blockVars, setBlockVars] = useState<Env['vars']>({});
  const getCurrentIndex = () => editorBlocks.findIndex(b => b.id === block.id);

  useEffect(() => {
    setupEditor();
  }, []);

  useEffect(() => {
    if (Object.keys(blockVars).length > 0) {
      const currIdx = getCurrentIndex();
      let lines = editorBlocks[currIdx].editor.getSession().getDocument().getAllLines();
      Object.keys(blockVars).forEach(key => {
        const lineIdx = blockVars[key].line - 1;
        const line = lines[lineIdx];
        if (blockVars[key].value !== parseFloat(line.split('=')[1])) {
          const newLine = `${line.split('=')[0]}= ${blockVars[key].value};`;
          lines[lineIdx] = newLine;
          editorBlocks[currIdx].editor.setValue(lines.join('\n'), 1);
        }
      });
    }
  }, [blockVars]);

  const updateDraw = () => {
    const fullFunction = editorBlocks.reduce((partial, current) => `${partial}\n${current.code}`, '');
    setDraw(fullFunction);
  };

  const updateBlock = (code: string, editor: ace.Editor, id: string) => {
    const blocks = editorBlocks;
    const currIdx = getCurrentIndex();
    blocks.splice(currIdx, 1, { code, editor, id });
    setEditorBlocks(blocks);
  };

  const updateHeight = (editor: ace.Editor, id: string) => {
    const h = (editor.getSession().getScreenLength() + 1) * editor.renderer.lineHeight;
    document.getElementById(id).style.height = `${h}px`;
    editor.resize();
  };

  const parseCode = (code: string, editor: ace.Editor, id: string) => {
    try {
      const ast = parse(code, { errorRecovery: true });
      const bodyStatements = ast.program.body;
      const finalAcc = bodyStatements.reduce(readStatement, {
        vars: {},
        updatedText: code,
        charShift: 0,
        editorCharShift: 0,
        scopePath: [],
      });
      const { updatedText, vars } = finalAcc;
      setBlockVars(vars);
      updateBlock(updatedText.trim(), editor, id);
      setSketchError(null);
    } catch (error) {
      setSketchError(error);
    }
  };

  const handleEditorChange = (editor: ace.Editor, id: string) => {
    editor.$blockScrolling = Infinity;
    parseCode(editor.getValue(), editor, id);
    updateDraw();
    updateHeight(editor, id);
  };

  const focusOnPrev = () => {
    const currIdx = getCurrentIndex();
    if (currIdx > 0) {
      editorBlocks[currIdx - 1].editor.navigateFileEnd();
      editorBlocks[currIdx - 1].editor.focus();
    }
  };

  const focusOnNext = () => {
    const currIdx = getCurrentIndex();
    if (currIdx < editorBlocks.length - 1) {
      editorBlocks[currIdx + 1].editor.navigateFileStart();
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
    updateHeight(editor, id);
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
    editor.commands.addCommand({
      name: 'upKey',
      bindKey: 'Up',
      exec: (editor: ace.Editor) => {
        const c = editor.getSession().selection.getCursor();
        if (c.row > 0) {
          editor.navigateUp();
        } else {
          focusOnPrev();
        }
      },
    });
    editor.commands.addCommand({
      name: 'downKey',
      bindKey: 'Down',
      exec: (editor: ace.Editor) => {
        const c = editor.getSession().selection.getCursor();
        const lines = editor.getSession().getScreenLength();
        if (c.row < lines - 1) {
          editor.navigateDown();
        } else {
          focusOnNext();
        }
      },
    });
    parseCode(block.code, editor, id);
  };

  const toggleAdd = () => {
    setAddOpen(!addOpen);
  };

  const handleAdd = (code: string, id: string) => {
    const blocks = editorBlocks;
    const currIdx = getCurrentIndex();
    blocks.splice(currIdx + 1, 0, { code, id });
    setEditorBlocks(blocks);
    setAddedBlocks(addedBlocks + 1);
    updateDraw();
  };

  const handleDelete = () => {
    const blocks = editorBlocks;
    const currIdx = getCurrentIndex();
    blocks.splice(currIdx, 1);
    setEditorBlocks(blocks);
    updateDraw();
  };

  const addShape = (shape: string) => {
    const code = blocks[shape].code(addedBlocks + 1);
    setAddOpen(false);
    handleAdd(code, createId(getCurrentIndex() + 1));
  };

  const handleInputChange = (key: string, value: number) => {
    const vars = blockVars;
    setBlockVars({ ...vars, [key]: { ...vars[key], value } });
  };

  return (
    <div className="flex flex-wrap pb-2 lg:pb-4 blockContainer">
      <div className="relative order-1 lg:order-2 flex-none blockEditorContainer">
        <div id={block.id} className="editor pr-32"></div>
      </div>
      <div className="self-end order-2 lg:order-1 flex flex-row lg:flex-col">
        {!addOpen && (
          <button
            className="py-4 px-4 text-stone-700 dark:text-stone-50 self-end editorButton order-2 lg:order-1"
            onClick={handleDelete}
          >
            <Subtract16 className="w-4 h-4" />
          </button>
        )}
        <button
          className="py-4 px-4 text-stone-700 dark:text-stone-50 self-end addBlock editorButton order-1 lg:order-2"
          onClick={toggleAdd}
        >
          <Add16 className={`w-4 h-4 ${addOpen ? 'add-open' : 'add-closed'}`} />
        </button>
      </div>
      {addOpen && (
        <div className="order-3 lg:ml-12 addBlockButtons">
          {Object.keys(blocks).map(block => (
            <button
              key={block}
              className="py-4 px-4 text-stone-700 dark:text-stone-50 editorButton"
              onClick={() => {
                addShape(block);
              }}
            >
              {blocks[block].icon}
            </button>
          ))}
        </div>
      )}
      {Object.keys(blockVars).length > 0 && (
        <div className="order-4 basis-full pl-4 lg:pl-12 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {Object.keys(blockVars).map(key => (
            <Slider
              id={`${key}-input`}
              key={key}
              labelText={key}
              value={blockVars[key].value}
              min={0}
              max={500}
              step={1}
              stepMultiplier={10}
              onChange={e => {
                handleInputChange(key, e.value);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
