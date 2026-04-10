import { spawnSync } from 'node:child_process';

const isWindows = process.platform === 'win32';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(process.execPath, ['./infra/scripts/run-database.mjs', 'generate']);

if (isWindows) {
  run('cmd.exe', ['/d', '/s', '/c', 'npm --prefix packages/shared run build']);
} else {
  run('npm', ['--prefix', 'packages/shared', 'run', 'build']);
}
