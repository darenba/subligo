import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const appDir = process.cwd();
const workspaceRoot = resolve(appDir, '..', '..');

function findNestBin() {
  const localBin = resolve(appDir, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');
  if (existsSync(localBin)) {
    return localBin;
  }

  const hoistedBin = resolve(workspaceRoot, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');
  if (existsSync(hoistedBin)) {
    return hoistedBin;
  }

  const pnpmRoot = resolve(workspaceRoot, 'node_modules', '.pnpm');
  if (existsSync(pnpmRoot)) {
    const nestEntry = readdirSync(pnpmRoot).find((entry) => entry.startsWith('@nestjs+cli@'));
    if (nestEntry) {
      const pnpmBin = resolve(
        pnpmRoot,
        nestEntry,
        'node_modules',
        '@nestjs',
        'cli',
        'bin',
        'nest.js',
      );
      if (existsSync(pnpmBin)) {
        return pnpmBin;
      }
    }
  }

  throw new Error('No se encontro @nestjs/cli en el workspace');
}

let nestBin;

try {
  nestBin = findNestBin();
} catch (error) {
  const message = error instanceof Error ? error.message : 'error desconocido';
  console.error(`[nest-runner] ${message}`);
  process.exit(1);
}

const child = spawn(process.execPath, [nestBin, ...args], {
  cwd: appDir,
  env: process.env,
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error(`[nest-runner] No se pudo iniciar Nest: ${error.message}`);
  process.exit(1);
});
