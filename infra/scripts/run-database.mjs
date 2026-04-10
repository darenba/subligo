import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..', '..');
const databaseDir = resolve(rootDir, 'packages', 'database');

const [, , task] = process.argv;

if (!task || !['generate', 'migrate', 'seed', 'validate'].includes(task)) {
  console.error('Uso: node infra/scripts/run-database.mjs <generate|migrate|seed|validate>');
  process.exit(1);
}

function loadEnvFile(filePath, env) {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trimStart().startsWith('#') || !line.includes('=')) {
      continue;
    }

    const [rawKey, ...rest] = line.split('=');
    const key = rawKey.trim();
    const value = rest.join('=').trim();

    if (!env[key]) {
      env[key] = value;
    }
  }
}

function buildEnv() {
  const env = { ...process.env };
  loadEnvFile(resolve(rootDir, '.env'), env);
  loadEnvFile(resolve(rootDir, '.env.local'), env);
  loadEnvFile(resolve(databaseDir, '.env'), env);
  loadEnvFile(resolve(databaseDir, 'prisma', '.env'), env);
  env.DATABASE_URL ||= 'postgresql://printos:printos@localhost:5433/printos_ai?schema=public';
  env.DIRECT_URL ||= env.DATABASE_URL;
  return env;
}

function isRetryableFsError(error) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      ['EBUSY', 'EPERM', 'ENOTEMPTY', 'EMFILE', 'ENFILE'].includes(error.code),
  );
}

function removePathWithRetries(targetPath) {
  const attempts = 5;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      rmSync(targetPath, {
        recursive: true,
        force: true,
        maxRetries: 2,
        retryDelay: 150,
      });
      return true;
    } catch (error) {
      if (!isRetryableFsError(error) || attempt === attempts) {
        throw error;
      }
    }
  }

  return false;
}

function getPrismaArtifactDirectories() {
  const directories = new Set([
    resolve(rootDir, 'apps', 'api', 'node_modules', '.prisma'),
    resolve(rootDir, 'node_modules', '.prisma'),
  ]);

  const pnpmRoot = resolve(rootDir, 'node_modules', '.pnpm');
  if (existsSync(pnpmRoot)) {
    for (const entry of readdirSync(pnpmRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.startsWith('@prisma+client@')) {
        continue;
      }

      directories.add(resolve(pnpmRoot, entry.name, 'node_modules', '.prisma'));
    }
  }

  return [...directories];
}

function cleanPrismaArtifacts() {
  for (const directory of getPrismaArtifactDirectories()) {
    if (!existsSync(directory)) {
      continue;
    }

    removePathWithRetries(directory);
  }
}

const prismaSentinelPatterns = [
  /enum\s+InvoiceStatus\b/,
  /\bmodel\s+Invoice\b/,
  /\binvoices\s+Invoice\[\]/,
];

function hasExpectedPrismaCapabilities(schemaText) {
  return prismaSentinelPatterns.every((pattern) => pattern.test(schemaText));
}

function validateGeneratedPrismaClient() {
  const candidates = getPrismaArtifactDirectories()
    .map((directory) => resolve(directory, 'client', 'schema.prisma'))
    .filter((candidate) => existsSync(candidate));

  if (candidates.length === 0) {
    throw new Error('No se encontro ningun schema generado de Prisma tras el generate.');
  }

  const validCandidate = candidates.find((candidate) =>
    hasExpectedPrismaCapabilities(readFileSync(candidate, 'utf8')),
  );

  if (!validCandidate) {
    throw new Error(
      `El cliente generado de Prisma sigue sin incluir Invoice/InvoiceStatus. Candidatos revisados: ${candidates.join(', ')}`,
    );
  }

  console.log(`[database] Prisma validado desde ${validCandidate}`);
}

function runNodeScript(scriptPath, args, env, options = {}) {
  const child = spawn(process.execPath, [scriptPath, ...args], {
    cwd: databaseDir,
    env,
    stdio: 'inherit',
  });

  child.on('exit', (code) => {
    if ((code ?? 1) === 0 && typeof options.onSuccess === 'function') {
      try {
        options.onSuccess();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        console.error(`[database] Validacion posterior a ${task} fallo: ${message}`);
        process.exit(1);
      }
    }

    process.exit(code ?? 1);
  });

  child.on('error', (error) => {
    console.error(`[database] No se pudo ejecutar ${task}: ${error.message}`);
    process.exit(1);
  });
}

function resolveExistingPath(candidates) {
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

const env = buildEnv();

if (task === 'seed') {
  const tsxCli = resolveExistingPath([
    resolve(databaseDir, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    resolve(rootDir, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
  ]);

  if (!tsxCli) {
    console.error('[database] No se encontro tsx para ejecutar el seed');
    process.exit(1);
  }

  runNodeScript(tsxCli, ['prisma/seed.ts'], env);
} else {
  const prismaCli = resolveExistingPath([
    resolve(databaseDir, 'node_modules', 'prisma', 'build', 'index.js'),
    resolve(rootDir, 'node_modules', 'prisma', 'build', 'index.js'),
  ]);

  if (!prismaCli) {
    console.error('[database] No se encontro Prisma CLI en el workspace');
    process.exit(1);
  }

  const args =
    task === 'generate'
      ? ['generate', '--schema', 'prisma/schema.prisma']
      : task === 'migrate'
        ? ['db', 'push', '--schema', 'prisma/schema.prisma']
        : ['validate', '--schema', 'prisma/schema.prisma'];

  if (task === 'generate' || task === 'migrate') {
    cleanPrismaArtifacts();
  }

  runNodeScript(prismaCli, args, env, {
    onSuccess:
      task === 'generate' || task === 'migrate'
        ? validateGeneratedPrismaClient
        : undefined,
  });
}
