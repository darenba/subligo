import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const [, , scriptName, ...workspaces] = process.argv;

if (!scriptName || workspaces.length === 0) {
  console.error('Uso: node infra/scripts/run-workspaces.mjs <script> <workspace...>');
  process.exit(1);
}

const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'cmd.exe' : 'npm';
const rootDir = process.cwd();

for (const workspace of workspaces) {
  const workspacePath = resolve(rootDir, workspace);

  await new Promise((resolveRun, rejectRun) => {
    const args = isWindows
      ? ['/d', '/s', '/c', `npm --prefix "${workspacePath}" run ${scriptName}`]
      : ['--prefix', workspacePath, 'run', scriptName];

    const child = spawn(
      npmCommand,
      args,
      {
        cwd: rootDir,
        env: process.env,
        stdio: 'inherit',
        shell: false,
      },
    );

    child.on('exit', (code) => {
      if (code === 0) {
        resolveRun(undefined);
        return;
      }

      rejectRun(new Error(`${workspace} -> npm run ${scriptName} fallo con codigo ${code ?? 1}`));
    });

    child.on('error', rejectRun);
  });
}
