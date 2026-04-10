import { spawn, spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';

const appDir = process.cwd();
const workspaceRoot = resolve(appDir, '..', '..');
const appNodeModules = resolve(appDir, 'node_modules');
const apiPort = Number(process.env.API_PORT ?? process.env.PORT ?? '3102');
const devLockPath = resolve(appDir, '.api-dev.lock');
const sourcePrismaSchemaPath = resolve(workspaceRoot, 'packages', 'database', 'prisma', 'schema.prisma');
const prismaSentinelPatterns = [
  /enum\s+InvoiceStatus\b/,
  /\bmodel\s+Invoice\b/,
  /\binvoices\s+Invoice\[\]/,
];

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function isProcessAlive(processId) {
  if (!Number.isFinite(processId) || processId <= 0) {
    return false;
  }

  try {
    process.kill(processId, 0);
    return true;
  } catch {
    return false;
  }
}

function killProcessTree(processId, contextLabel) {
  if (!Number.isFinite(processId) || processId <= 0 || processId === process.pid) {
    return;
  }

  if (process.platform === 'win32') {
    const result = spawnSync('taskkill', ['/PID', String(processId), '/T', '/F'], {
      cwd: appDir,
      encoding: 'utf8',
      stdio: 'pipe',
    });

    if (result.stdout?.trim()) {
      process.stdout.write(result.stdout);
    }

    if (result.stderr?.trim()) {
      process.stderr.write(result.stderr);
    }

    if (result.status === 0) {
      console.warn(`[api-dev] Se detuvo una instancia previa de ${contextLabel} (PID ${processId}).`);
    }
    return;
  }

  try {
    process.kill(processId, 'SIGTERM');
    console.warn(`[api-dev] Se detuvo una instancia previa de ${contextLabel} (PID ${processId}).`);
  } catch {
    // Ignoramos errores si el proceso ya no existe.
  }
}

function releaseDevLock() {
  try {
    if (!existsSync(devLockPath)) {
      return;
    }

    const owner = Number(readFileSync(devLockPath, 'utf8').trim());
    if (owner === process.pid) {
      unlinkSync(devLockPath);
    }
  } catch {
    // El lock es solo una ayuda local; no debe tumbar el runner.
  }
}

function acquireDevLock() {
  try {
    if (existsSync(devLockPath)) {
      const previousOwner = Number(readFileSync(devLockPath, 'utf8').trim());
      if (previousOwner && previousOwner !== process.pid && isProcessAlive(previousOwner)) {
        killProcessTree(previousOwner, 'run-api-dev');
        sleepSync(400);
      }
    }

    writeFileSync(devLockPath, String(process.pid), 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.warn(`[api-dev] No se pudo asegurar el lock local del watcher: ${message}`);
  }
}

function isRetryableFsError(error) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      ['EBUSY', 'EPERM', 'ENOTEMPTY', 'EMFILE', 'ENFILE'].includes(error.code),
  );
}

function copyDirectoryWithRetries(source, target, repaired, contextLabel) {
  mkdirSync(resolve(target, '..'), { recursive: true });

  const attempts = 5;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      cpSync(source, target, { recursive: true, force: true });
      repaired.push(target);
      return true;
    } catch (error) {
      if (!isRetryableFsError(error)) {
        throw error;
      }

      if (attempt === attempts) {
        console.warn(
          `[api-dev] No se pudo reparar ${contextLabel} en ${target} por bloqueo temporal (${error.code}). Se omite este paquete en este intento.`,
        );
        return false;
      }

      sleepSync(attempt * 150);
    }
  }

  return false;
}

function findDistEntry() {
  const candidates = [
    resolve(appDir, 'dist', 'main.js'),
    resolve(appDir, 'dist', 'apps', 'api', 'src', 'main.js'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function isDirectory(path) {
  try {
    return existsSync(path) && readdirSync(path) !== null;
  } catch {
    return false;
  }
}

function hasExpectedPrismaCapabilities(schemaText) {
  return prismaSentinelPatterns.every((pattern) => pattern.test(schemaText));
}

function hasPackageManifest(path) {
  return existsSync(resolve(path, 'package.json'));
}

function resolvePackageEntryCandidates(packageJson) {
  const candidates = new Set(['index.js', 'index.d.ts', 'default.js', 'default.d.ts']);

  for (const field of ['main', 'module', 'types', 'typings']) {
    const value = packageJson?.[field];
    if (typeof value === 'string' && value.length > 0) {
      candidates.add(value);
    }
  }

  const exportsField = packageJson?.exports;
  if (typeof exportsField === 'string') {
    candidates.add(exportsField);
  } else if (exportsField && typeof exportsField === 'object') {
    const rootExport = exportsField['.'] ?? exportsField;
    if (typeof rootExport === 'string') {
      candidates.add(rootExport);
    } else if (rootExport && typeof rootExport === 'object') {
      for (const key of ['import', 'require', 'default', 'types']) {
        const value = rootExport[key];
        if (typeof value === 'string' && value.length > 0) {
          candidates.add(value);
        }
      }
    }
  }

  return [...candidates];
}

function hasUsablePackageFiles(path) {
  if (!hasPackageManifest(path)) {
    return false;
  }

  const packageJson = getPackageJsonFromPath(path);
  if (!packageJson) {
    return false;
  }

  const candidates = resolvePackageEntryCandidates(packageJson);
  return candidates.some((file) => existsSync(resolve(path, file)));
}

function maybeRepairPackage(source, target, repaired) {
  if (!isDirectory(source) || !hasPackageManifest(source)) {
    return;
  }

  if (hasUsablePackageFiles(target)) {
    return;
  }

  copyDirectoryWithRetries(source, target, repaired, 'paquete local');
}

function* iterateInstalledPackages() {
  if (!isDirectory(appNodeModules)) {
    return;
  }

  for (const entry of readdirSync(appNodeModules, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) {
      continue;
    }

    if (entry.name.startsWith('@')) {
      const scopeDir = resolve(appNodeModules, entry.name);
      for (const child of readdirSync(scopeDir, { withFileTypes: true })) {
        if (!child.isDirectory()) {
          continue;
        }

        yield {
          packageName: `${entry.name}/${child.name}`,
          target: resolve(scopeDir, child.name),
        };
      }

      continue;
    }

    yield {
      packageName: entry.name,
      target: resolve(appNodeModules, entry.name),
    };
  }
}

function repairFromHiddenVariants(parentDir, repaired) {
  if (!isDirectory(parentDir)) {
    return;
  }

  const entries = readdirSync(parentDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const match = entry.name.match(/^\.(.+)-[A-Za-z0-9]{8}$/);
    if (!match) {
      continue;
    }

    const packageName = match[1];
    const source = resolve(parentDir, entry.name);
    const target = resolve(parentDir, packageName);
    maybeRepairPackage(source, target, repaired);
  }
}

function repairPrismaRuntime(repaired) {
  const pnpmRoot = resolve(workspaceRoot, 'node_modules', '.pnpm');
  const prismaTargets = [
    resolve(appNodeModules, '.prisma'),
  ];
  const expectedSchema = existsSync(sourcePrismaSchemaPath)
    ? readFileSync(sourcePrismaSchemaPath, 'utf8')
    : null;

  const prismaSources = [
    resolve(workspaceRoot, 'node_modules', '.prisma'),
    ...(existsSync(pnpmRoot)
      ? readdirSync(pnpmRoot, { withFileTypes: true })
          .filter((entry) => entry.isDirectory() && entry.name.startsWith('@prisma+client@'))
          .map((entry) =>
            resolve(
              pnpmRoot,
              entry.name,
              'node_modules',
              '.prisma',
            ),
          )
      : []),
  ];

  for (const target of prismaTargets) {
    const source = prismaSources.find((candidate) => {
      if (candidate === target) {
        return false;
      }

      const indexPath = resolve(candidate, 'client', 'index.d.ts');
      const schemaPath = resolve(candidate, 'client', 'schema.prisma');
      if (!existsSync(indexPath) || !existsSync(schemaPath)) {
        return false;
      }

      const schemaText = readFileSync(schemaPath, 'utf8');
      if (expectedSchema && schemaText === expectedSchema) {
        return true;
      }

      return hasExpectedPrismaCapabilities(schemaText);
    });

    if (!source) {
      continue;
    }

    const sourceIndexPath = resolve(source, 'client', 'index.d.ts');
    const sourceSchemaPath = resolve(source, 'client', 'schema.prisma');
    const targetIndexPath = resolve(target, 'client', 'index.d.ts');
    const targetSchemaPath = resolve(target, 'client', 'schema.prisma');
    const sourceIndex = readFileSync(sourceIndexPath, 'utf8');
    const sourceSchema = readFileSync(sourceSchemaPath, 'utf8');
    const targetIndex = existsSync(targetIndexPath)
      ? readFileSync(targetIndexPath, 'utf8')
      : null;
    const targetSchema = existsSync(targetSchemaPath)
      ? readFileSync(targetSchemaPath, 'utf8')
      : null;

    if (
      targetIndex === sourceIndex &&
      targetSchema === sourceSchema &&
      typeof targetSchema === 'string' &&
      hasExpectedPrismaCapabilities(targetSchema)
    ) {
      continue;
    }

    copyDirectoryWithRetries(source, target, repaired, '.prisma');
  }
}

function repairLocalNodeModules() {
  if (!isDirectory(appNodeModules)) {
    return;
  }

  const repaired = [];

  repairFromHiddenVariants(appNodeModules, repaired);

  for (const entry of readdirSync(appNodeModules, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith('@')) {
      continue;
    }

    repairFromHiddenVariants(resolve(appNodeModules, entry.name), repaired);
  }

  repairPrismaRuntime(repaired);
  hydrateDeclaredDependencies(repaired);
  repairInstalledPackages(repaired);

  if (repaired.length > 0) {
    console.log(
      `[api-dev] Se repararon ${repaired.length} paquetes truncados en apps/api/node_modules`,
    );
  }
}

function readJson(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf8').trim();
    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function stripAnsi(value) {
  return value.replace(/\u001b\[[0-9;]*m/g, '');
}

function findWorkspacePackageSource(spec) {
  if (typeof spec !== 'string' || !spec.startsWith('file:')) {
    return null;
  }

  const source = resolve(appDir, spec.slice(5));
  return hasPackageManifest(source) ? source : null;
}

function findPnpmPackageSource(packageName) {
  const pnpmRoot = resolve(workspaceRoot, 'node_modules', '.pnpm');
  if (!existsSync(pnpmRoot)) {
    return null;
  }

  const normalized = packageName.replaceAll('/', '+');
  const match = readdirSync(pnpmRoot, { withFileTypes: true }).find(
    (entry) => entry.isDirectory() && entry.name.startsWith(`${normalized}@`),
  );

  if (!match) {
    return null;
  }

  const source = resolve(pnpmRoot, match.name, 'node_modules', ...packageName.split('/'));
  return hasPackageManifest(source) ? source : null;
}

function getPackageJsonFromPath(path) {
  const packageJsonPath = resolve(path, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return null;
  }

  return readJson(packageJsonPath);
}

function collectChildDependencies(packageJson) {
  return Object.entries({
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.peerDependencies ?? {}),
  });
}

function hydrateDeclaredDependencies(repaired) {
  const packageJsonPath = resolve(appDir, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return;
  }

  const packageJson = readJson(packageJsonPath);
  if (!packageJson) {
    return;
  }

  const queue = Object.entries({
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
  });
  const visited = new Set();

  while (queue.length > 0) {
    const [packageName, spec] = queue.shift();
    if (!packageName || visited.has(packageName)) {
      continue;
    }
    visited.add(packageName);

    const target = resolve(appNodeModules, ...packageName.split('/'));
    const source =
      findWorkspacePackageSource(spec) ??
      findPnpmPackageSource(packageName);

    if (!source) {
      continue;
    }

    if (!hasUsablePackageFiles(target)) {
      copyDirectoryWithRetries(source, target, repaired, 'dependencia declarada');
    }

    const childPackageJson = getPackageJsonFromPath(source) ?? getPackageJsonFromPath(target);
    if (!childPackageJson) {
      continue;
    }

    for (const dependencyEntry of collectChildDependencies(childPackageJson)) {
      queue.push(dependencyEntry);
    }
  }
}

function repairInstalledPackages(repaired) {
  for (const { packageName, target } of iterateInstalledPackages()) {
    if (hasUsablePackageFiles(target)) {
      continue;
    }

    const source = findPnpmPackageSource(packageName);
    if (!source) {
      continue;
    }

    copyDirectoryWithRetries(source, target, repaired, packageName);
  }
}

function findTypeScriptEntry() {
  const candidates = [
    // Preferimos el TypeScript raiz del workspace para evitar shims rotos
    // en node_modules parciales dentro de apps/api.
    resolve(workspaceRoot, 'node_modules', 'typescript', 'lib', 'tsc.js'),
    resolve(appDir, 'node_modules', 'typescript', 'lib', 'tsc.js'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  const pnpmRoot = resolve(workspaceRoot, 'node_modules', '.pnpm');
  if (existsSync(pnpmRoot)) {
    const entry = readdirSync(pnpmRoot).find((item) => item.startsWith('typescript@'));
    if (entry) {
      const candidate = resolve(pnpmRoot, entry, 'node_modules', 'typescript', 'lib', 'tsc.js');
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  throw new Error('No se encontro TypeScript en el workspace');
}

acquireDevLock();
repairLocalNodeModules();

const tscEntry = findTypeScriptEntry();

let shuttingDown = false;
let appProcess = null;
let compilerBuffer = '';
let restartTimer = null;
let restartInProgress = false;
let compilerState = 'idle';
let buildGeneration = 0;
let lastRestartedGeneration = -1;
let portRecoveryAttempts = 0;

function releasePortListeners(port) {
  if (process.platform !== 'win32') {
    return;
  }

  const powershellScript = `
$processIds = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique
foreach ($processId in $processIds) {
  try {
    Stop-Process -Id $processId -Force -ErrorAction Stop
    Write-Host "[api-dev] Puerto ${port} liberado (PID $processId)"
  } catch {
    Write-Warning "[api-dev] No se pudo detener el PID $processId en el puerto ${port}"
  }
}
`;

  const result = spawnSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', powershellScript],
    {
      cwd: appDir,
      encoding: 'utf8',
      stdio: 'pipe',
    },
  );

  if (result.stdout?.trim()) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr?.trim()) {
    process.stderr.write(result.stderr);
  }
}

function getPortListeners(port) {
  if (process.platform !== 'win32') {
    return [];
  }

  const powershellScript = `
$processIds = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique
if ($processIds) {
  $processIds | ForEach-Object { Write-Output $_ }
}
`;

  const result = spawnSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', powershellScript],
    {
      cwd: appDir,
      encoding: 'utf8',
      stdio: 'pipe',
    },
  );

  if (result.status !== 0) {
    return [];
  }

  return (result.stdout ?? '')
    .split(/\r?\n/)
    .map((line) => Number(line.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
}

async function waitForPortRelease(port, timeoutMs = 12000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (getPortListeners(port).length === 0) {
      return true;
    }

    await sleep(250);
  }

  return getPortListeners(port).length === 0;
}

async function ensureApiPortAvailable(contextLabel) {
  releasePortListeners(apiPort);
  const released = await waitForPortRelease(apiPort, 12000);

  if (!released) {
    console.warn(
      `[api-dev] El puerto ${apiPort} sigue ocupado antes de ${contextLabel}. Se continuara, pero podria requerirse otro reinicio limpio.`,
    );
  }
}

function stopApp() {
  return new Promise((resolveStop) => {
    if (!appProcess) {
      resolveStop();
      return;
    }

    const currentProcess = appProcess;
    appProcess = null;
    const currentProcessId = currentProcess.pid;

    if (currentProcess.exitCode !== null || currentProcess.killed) {
      resolveStop();
      return;
    }

    const timeout = setTimeout(() => {
      resolveStop();
    }, 1500);

    currentProcess.once('exit', () => {
      clearTimeout(timeout);
      resolveStop();
    });

    if (process.platform === 'win32' && currentProcessId) {
      spawnSync(
        'taskkill',
        ['/PID', String(currentProcessId), '/T', '/F'],
        {
          cwd: appDir,
          encoding: 'utf8',
          stdio: 'pipe',
        },
      );
      return;
    }

    currentProcess.kill();
  });
}

async function restartApp() {
  if (restartInProgress) {
    return;
  }

  restartInProgress = true;
  let distEntry = null;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    distEntry = findDistEntry();
    if (distEntry) {
      break;
    }

    await sleep(150);
  }

  if (!distEntry) {
    console.warn('[api-dev] TypeScript compilo, pero no se encontro el entrypoint de salida en dist/');
    restartInProgress = false;
    return;
  }

  await stopApp();
  releasePortListeners(apiPort);
  const released = await waitForPortRelease(apiPort);

  if (!released) {
    console.warn(`[api-dev] El puerto ${apiPort} sigue ocupado; se omitio este reinicio para evitar instancias duplicadas.`);
    restartInProgress = false;
    return;
  }

  if (shuttingDown) {
    restartInProgress = false;
    return;
  }

  await sleep(250);
  console.log(`[api-dev] Iniciando API desde ${distEntry}`);

  const child = spawn(process.execPath, [distEntry], {
    cwd: appDir,
    env: process.env,
    stdio: 'inherit',
  });

  appProcess = child;

  child.on('exit', (code) => {
    if (!shuttingDown && code && code !== 0) {
      const listeners = getPortListeners(apiPort);

      if (listeners.length > 0 && portRecoveryAttempts < 2) {
        portRecoveryAttempts += 1;
        console.warn(
          `[api-dev] La API salio con codigo ${code} y el puerto ${apiPort} sigue ocupado. Intentando recuperar el listener stale...`,
        );

        void (async () => {
          releasePortListeners(apiPort);
          const released = await waitForPortRelease(apiPort);
          if (released && !shuttingDown) {
            scheduleRestart();
            return;
          }

          console.error(`[api-dev] No se pudo recuperar el puerto ${apiPort} tras la salida de la API.`);
        })();
      } else {
        console.error(`[api-dev] La API salio con codigo ${code}`);
      }
    }

    if (appProcess === child) {
      appProcess = null;
    }
  });

  child.on('error', (error) => {
    if (!shuttingDown) {
      console.error(`[api-dev] No se pudo iniciar la API compilada: ${error.message}`);
    }
  });

  portRecoveryAttempts = 0;
  restartInProgress = false;
}

function scheduleRestart() {
  if (restartTimer) {
    clearTimeout(restartTimer);
  }

  restartTimer = setTimeout(() => {
    restartTimer = null;
    void restartApp();
  }, 150);
}

await ensureApiPortAvailable('iniciar el watcher de la API');

function handleCompilerOutput(chunk, writer) {
  const text = chunk.toString();
  writer.write(text);
  compilerBuffer += text;

  const lines = compilerBuffer.split(/\r?\n/);
  compilerBuffer = lines.pop() ?? '';

  for (const line of lines) {
    const normalizedLine = stripAnsi(line);

    if (
      /Starting compilation in watch mode\.\.\.|File change detected\. Starting incremental compilation\.\.\./.test(
        normalizedLine,
      )
    ) {
      compilerState = 'compiling';
      buildGeneration += 1;
      continue;
    }

    if (/Found 0 errors?\./.test(normalizedLine)) {
      const shouldRestart = buildGeneration > lastRestartedGeneration || !appProcess;
      compilerState = 'clean';

      if (shouldRestart) {
        lastRestartedGeneration = buildGeneration;
        scheduleRestart();
      }
      continue;
    }

    if (/Found \d+ errors?\./.test(normalizedLine)) {
      compilerState = 'error';
      void stopApp();
    }
  }
}

const compiler = spawn(
  process.execPath,
  [tscEntry, '-p', 'tsconfig.json', '--watch', '--preserveWatchOutput'],
  {
    cwd: appDir,
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
  },
);

compiler.stdout.on('data', (chunk) => {
  handleCompilerOutput(chunk, process.stdout);
});

compiler.stderr.on('data', (chunk) => {
  handleCompilerOutput(chunk, process.stderr);
});

compiler.on('exit', (code) => {
  void stopApp();
  releaseDevLock();
  if (!shuttingDown) {
    process.exit(code ?? 1);
  }
});

compiler.on('error', (error) => {
  console.error(`[api-dev] No se pudo iniciar el compilador TypeScript: ${error.message}`);
  void stopApp();
  releaseDevLock();
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    shuttingDown = true;
    if (restartTimer) {
      clearTimeout(restartTimer);
      restartTimer = null;
    }
    void stopApp();
    if (!compiler.killed) {
      compiler.kill(signal);
    }
    releaseDevLock();
  });
}

process.on('exit', () => {
  releaseDevLock();
});
