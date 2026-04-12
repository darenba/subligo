import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_PUBLIC_BUCKET = 'printos-public';
const DEFAULT_PRIVATE_BUCKET = 'printos-private';
const LOCAL_STORAGE_ROOT = 'storage';

let cachedClient: SupabaseClient | null = null;
const ensuredBuckets = new Set<string>();

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function normalizeObjectPath(objectPath: string) {
  return objectPath.replaceAll('\\', '/').replace(/^\/+/, '');
}

function resolveRepoRoot() {
  const cwd = process.cwd().replaceAll('\\', '/');
  return cwd.endsWith('/apps/api') ? path.resolve(process.cwd(), '..', '..') : process.cwd();
}

export function resolveLocalStorageRoot() {
  return path.join(resolveRepoRoot(), LOCAL_STORAGE_ROOT);
}

function resolveLocalObjectPath(objectPath: string) {
  const normalizedPath = normalizeObjectPath(objectPath);
  return path.join(resolveLocalStorageRoot(), ...normalizedPath.split('/'));
}

function resolvePublicApiBaseUrl() {
  const port = process.env['PORT'] ?? process.env['API_PORT'] ?? 3102;
  return trimTrailingSlash(process.env['PUBLIC_API_BASE_URL'] ?? `http://localhost:${port}`);
}

function resolveSupabaseStorageConfig() {
  const url = trimTrailingSlash(process.env['SUPABASE_URL']?.trim() ?? '');
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']?.trim() ?? '';
  const publicBucket = process.env['SUPABASE_PUBLIC_BUCKET']?.trim() || DEFAULT_PUBLIC_BUCKET;
  const privateBucket = process.env['SUPABASE_PRIVATE_BUCKET']?.trim() || DEFAULT_PRIVATE_BUCKET;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url,
    serviceRoleKey,
    publicBucket,
    privateBucket,
  };
}

export function isRemoteObjectStorageEnabled() {
  return Boolean(resolveSupabaseStorageConfig());
}

function getSupabaseAdminClient() {
  const config = resolveSupabaseStorageConfig();
  if (!config) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return {
    client: cachedClient,
    config,
  };
}

async function ensureBucket(bucketName: string, isPublic: boolean) {
  const storage = getSupabaseAdminClient();
  if (!storage) {
    return false;
  }

  const cacheKey = `${bucketName}:${isPublic ? 'public' : 'private'}`;
  if (ensuredBuckets.has(cacheKey)) {
    return true;
  }

  const { data: buckets, error: listError } = await storage.client.storage.listBuckets();
  if (listError) {
    throw new Error(`[storage] No se pudo listar buckets de Supabase: ${listError.message}`);
  }

  const bucket = (buckets ?? []).find((item) => item.id === bucketName || item.name === bucketName);
  if (!bucket) {
    const { error: createError } = await storage.client.storage.createBucket(bucketName, {
      public: isPublic,
    });
    if (createError && !/already exists/i.test(createError.message)) {
      throw new Error(
        `[storage] No se pudo crear el bucket ${bucketName} en Supabase: ${createError.message}`,
      );
    }
  }

  ensuredBuckets.add(cacheKey);
  return true;
}

async function writeLocalObject(
  objectPath: string,
  body: Buffer | string,
  encoding?: BufferEncoding,
) {
  const destination = resolveLocalObjectPath(objectPath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, body, encoding);
  return destination;
}

export async function uploadPublicFile(options: {
  objectPath: string;
  body: Buffer | string;
  contentType: string;
}) {
  const normalizedPath = normalizeObjectPath(options.objectPath);
  const storage = getSupabaseAdminClient();

  if (!storage) {
    await writeLocalObject(
      normalizedPath,
      options.body,
      typeof options.body === 'string' ? 'utf8' : undefined,
    );
    return `${resolvePublicApiBaseUrl()}/files/${normalizedPath}`;
  }

  await ensureBucket(storage.config.publicBucket, true);

  const payload =
    typeof options.body === 'string'
      ? new Blob([options.body], { type: options.contentType })
      : new Blob([new Uint8Array(options.body)], { type: options.contentType });

  const { error } = await storage.client.storage
    .from(storage.config.publicBucket)
    .upload(normalizedPath, payload, {
      upsert: true,
      cacheControl: '3600',
      contentType: options.contentType,
    });

  if (error) {
    throw new Error(
      `[storage] No se pudo subir ${normalizedPath} a Supabase Storage: ${error.message}`,
    );
  }

  const { data } = storage.client.storage
    .from(storage.config.publicBucket)
    .getPublicUrl(normalizedPath);
  return data.publicUrl;
}

export async function readPrivateJsonFile<T>(objectPath: string): Promise<T | null> {
  const normalizedPath = normalizeObjectPath(objectPath);
  const storage = getSupabaseAdminClient();

  if (!storage) {
    try {
      const raw = await readFile(resolveLocalObjectPath(normalizedPath), 'utf8');
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  await ensureBucket(storage.config.privateBucket, false);

  const { data, error } = await storage.client.storage
    .from(storage.config.privateBucket)
    .download(normalizedPath);

  if (error) {
    if (/not found|does not exist/i.test(error.message)) {
      return null;
    }

    throw new Error(
      `[storage] No se pudo leer ${normalizedPath} desde Supabase Storage: ${error.message}`,
    );
  }

  const raw = await data.text();
  return JSON.parse(raw) as T;
}

export async function writePrivateJsonFile(objectPath: string, payload: unknown) {
  const normalizedPath = normalizeObjectPath(objectPath);
  const serialized = JSON.stringify(payload, null, 2);
  const storage = getSupabaseAdminClient();

  if (!storage) {
    await writeLocalObject(normalizedPath, serialized, 'utf8');
    return;
  }

  await ensureBucket(storage.config.privateBucket, false);

  const { error } = await storage.client.storage
    .from(storage.config.privateBucket)
    .upload(normalizedPath, new Blob([serialized], { type: 'application/json' }), {
      upsert: true,
      cacheControl: '0',
      contentType: 'application/json; charset=utf-8',
    });

  if (error) {
    throw new Error(
      `[storage] No se pudo guardar ${normalizedPath} en Supabase Storage: ${error.message}`,
    );
  }
}
