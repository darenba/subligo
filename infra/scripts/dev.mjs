import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'cmd.exe' : 'npm';
const rootDir = process.cwd();

const workspaces = [
  { name: 'api', path: resolve(rootDir, 'apps/api') },
  { name: 'web', path: resolve(rootDir, 'apps/web') },
  { name: 'admin', path: resolve(rootDir, 'apps/admin') },
];

const children = new Map();
let shuttingDown = false;
let exitCode = 0;

function runPreflight(command, args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      env: process.env,
      stdio: 'inherit',
      shell: false,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`preflight exited with code ${code ?? 1}`));
    });

    child.on('error', rejectPromise);
  });
}

function writePrefixedLines(prefix, chunk, writer, state) {
  state.buffer += chunk.toString();
  const lines = state.buffer.split(/\r?\n/);
  state.buffer = lines.pop() ?? '';

  for (const line of lines) {
    writer(`[${prefix}] ${line}\n`);
  }
}

function flushBufferedLine(prefix, writer, state) {
  if (!state.buffer) return;
  writer(`[${prefix}] ${state.buffer}\n`);
  state.buffer = '';
}

function stopChildren(signal = 'SIGTERM') {
  for (const child of children.values()) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

function finalizeIfDone() {
  if (children.size === 0) {
    process.exit(exitCode);
  }
}

async function main() {
  try {
    const preflightCommands = [
      'npm --prefix packages/shared run build',
      'npm --prefix packages/ai-agents run build',
    ];

    process.stdout.write('[runner] Construyendo @printos/shared y @printos/ai-agents antes de iniciar servicios...\n');

    for (const command of preflightCommands) {
      const preflightArgs = isWindows
        ? ['/d', '/s', '/c', command]
        : command.split(' ');
      await runPreflight(npmCommand, preflightArgs);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    process.stderr.write(`[runner] Fallo el preflight de paquetes compartidos: ${message}\n`);
    process.exit(1);
  }

  for (const workspace of workspaces) {
    const args = isWindows ? ['/d', '/s', '/c', 'npm run dev'] : ['run', 'dev'];
    const child = spawn(npmCommand, args, {
      cwd: workspace.path,
      env: process.env,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: false,
    });

    const stdoutState = { buffer: '' };
    const stderrState = { buffer: '' };

    child.stdout.on('data', (chunk) => {
      writePrefixedLines(
        workspace.name,
        chunk,
        process.stdout.write.bind(process.stdout),
        stdoutState,
      );
    });

    child.stderr.on('data', (chunk) => {
      writePrefixedLines(
        workspace.name,
        chunk,
        process.stderr.write.bind(process.stderr),
        stderrState,
      );
    });

    child.on('exit', (code) => {
      flushBufferedLine(workspace.name, process.stdout.write.bind(process.stdout), stdoutState);
      flushBufferedLine(workspace.name, process.stderr.write.bind(process.stderr), stderrState);
      children.delete(workspace.name);

      if (!shuttingDown && code && code !== 0) {
        exitCode = code;
        process.stderr.write(`[runner] ${workspace.name} finalizo con codigo ${code}.\n`);
      }

      finalizeIfDone();
    });

    child.on('error', (error) => {
      if (!shuttingDown) {
        exitCode = 1;
        process.stderr.write(`[runner] No se pudo iniciar ${workspace.name}: ${error.message}\n`);
        children.delete(workspace.name);
        finalizeIfDone();
      }
    });

    children.set(workspace.name, child);
  }

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      if (!shuttingDown) {
        shuttingDown = true;
        exitCode = 0;
        stopChildren(signal);
      }
    });
  }
}

main();
