import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit';
import { WebContainer } from '@webcontainer/api';
import { files } from './files';
import { createEditor, resolveModuleType } from './editor'
import 'xterm/css/xterm.css';
import './style.css'
import { compressToEncodedURIComponent } from 'lz-string';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <div class="editor"></div>
    <div class="terminal"></div>
  </div>
`

const editorEl = document.querySelector('.editor');
const terminalEl = document.querySelector('.terminal');

const submitCommand = (wc: WebContainer, terminal: Terminal) => async (command: string, args: string[], show = true): Promise<readonly [number, string]> => {
  const process = await wc.spawn(command, args);
  let output = ''
  process.output.pipeTo(new WritableStream({
    write(data) {
      output += data;
      if (show) terminal.write(data);
    }
  }))
  const exit = await process.exit
  return [exit, output] as const;
}

async function write(wc: WebContainer, content: string) {
  await wc.fs.writeFile('/index.ts', content);
  localStorage.setItem('code', content)
  window.location.hash = `code/${compressToEncodedURIComponent(content)}`
};

window.addEventListener('load', async () => {
  if (editorEl == null || !(editorEl instanceof HTMLElement)) {
    throw new Error("editorEl is null");
  }
  if (terminalEl == null || !(terminalEl instanceof HTMLElement)) {
    throw new Error("terminalEl is null");
  }
  
  const fitAddon = new FitAddon();
  const terminal = new Terminal({
    convertEol: true,
  });
  terminal.loadAddon(fitAddon);
  terminal.open(terminalEl);

  fitAddon.fit();

  const wc = await WebContainer.boot();
  await wc.mount(files);

  const cmd = submitCommand(wc, terminal)

  const [exitCode] = await cmd('npm', ['install']);
  if (exitCode !== 0) {
    throw new Error('Installation failed');
  };

  const [, globOut] = await cmd('npx', ['glob', '--nodir', './node_modules/fp-ts/**/*.+(ts|json)'], false)
  const fpTsFiles = globOut.split('\n').map(x => x.trim())
  await fpTsFiles.reduce(async (p, file) => {
    await p
    const content = await wc.fs.readFile(file)
    return resolveModuleType(new TextDecoder().decode(content), file.replace('node_modules/', ''))
  }, Promise.resolve())

  createEditor(editorEl, files['index.ts'].file.contents, (s: string) => write(wc, s));

  const shellProcess = await wc.spawn('jsh');
  shellProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        terminal.write(data);
      },
    })
  );
  const input = shellProcess.input.getWriter();
  terminal.onData((data) => {
    input.write(data);
  });

  input.write('npm run start\n')
});
