import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

const [, , mode, appName] = process.argv;

if (!mode || !appName) {
  console.error('Uso: node infra/scripts/run-next.mjs <dev|start> <web|admin>');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..');
const appDir = path.resolve(workspaceRoot, 'apps', appName);
const nextBin = require.resolve('next/dist/bin/next', { paths: [appDir] });
const rootEnvPath = path.resolve(workspaceRoot, '.env');

if (fs.existsSync(rootEnvPath)) {
  const lines = fs.readFileSync(rootEnvPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.startsWith('#') || !line.includes('=')) {
      continue;
    }

    const [key, ...rest] = line.split('=');
    if (!process.env[key]) {
      process.env[key] = rest.join('=');
    }
  }
}

const port =
  appName === 'web'
    ? process.env.WEB_PORT || '3000'
    : process.env.ADMIN_PORT || '3001';

const child = spawn(process.execPath, [nextBin, mode, '-p', port], {
  cwd: appDir,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
