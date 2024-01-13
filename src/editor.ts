import * as monaco from 'monaco-editor';

// @ts-ignore
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
// @ts-ignore
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
// @ts-ignore
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
// @ts-ignore
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
// @ts-ignore
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === "json") {
      return new jsonWorker();
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new cssWorker();
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new htmlWorker();
    }
    if (label === "typescript" || label === "javascript") {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

export const resolveModuleType = async (
  content: string,
  file: string,
): Promise<void> => {
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    content,
    `file:///node_modules/@types/${file}`
  );
};

export const createEditor = (el: HTMLElement, value: string, handler: (v: string) => unknown) => {
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2016,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    typeRoots: ["node_modules/@types"]
  });
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });
  const editor = monaco.editor.create(el, {
    value,
    language: 'typescript',
    theme: 'vs-dark',
    model: monaco.editor.createModel(value, "typescript", monaco.Uri.parse('file:///index.ts'))
  });
  editor.onDidChangeModelContent(() => {
    handler(editor.getValue())
  })
  console.log(monaco.languages.typescript.typescriptDefaults.getExtraLibs())
}