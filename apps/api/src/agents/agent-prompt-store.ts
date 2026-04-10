import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  AGENT_PROMPTS,
  getAgentPrompt,
  type AgentId,
  type AgentPromptTemplate,
} from '@printos/ai-agents';

type PromptVersionRecord = {
  version: string;
  purpose: string;
  systemPrompt: string;
  userPromptTemplate: string;
  updatedAt: string;
  updatedById: string | null;
  note: string | null;
};

type PromptStoreEntry = {
  baseVersion: string;
  currentVersion: string;
  versions: PromptVersionRecord[];
};

type PromptStoreFile = {
  prompts: Record<string, PromptStoreEntry>;
};

export type ResolvedAgentPrompt = AgentPromptTemplate & {
  baseVersion: string;
  updatedAt: string | null;
  updatedById: string | null;
  isCustomized: boolean;
  history: PromptVersionRecord[];
};

type UpdatePromptInput = {
  purpose?: string;
  systemPrompt?: string;
  userPromptTemplate?: string;
  version?: string;
  note?: string;
};

const STORE_FILENAME = 'agent-prompts.overrides.json';

function resolveRepoRoot() {
  return path.resolve(process.cwd(), '..', '..');
}

function resolveStorePath() {
  return path.join(resolveRepoRoot(), 'storage', STORE_FILENAME);
}

function normalizeText(value: string | undefined) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function defaultUpdatedAt(version: string) {
  const match = /^(\d{4}-\d{2}-\d{2})\.\d+$/.exec(version);
  if (!match) {
    return null;
  }

  return `${match[1]}T00:00:00.000Z`;
}

function buildBaseVersion(template: AgentPromptTemplate): PromptVersionRecord {
  return {
    version: template.version,
    purpose: template.purpose,
    systemPrompt: template.systemPrompt,
    userPromptTemplate: template.userPromptTemplate,
    updatedAt: defaultUpdatedAt(template.version) ?? new Date().toISOString(),
    updatedById: null,
    note: 'Prompt base del framework',
  };
}

function buildNextVersion(currentVersion: string) {
  const today = new Date().toISOString().slice(0, 10);
  const match = /^(\d{4}-\d{2}-\d{2})\.(\d+)$/.exec(currentVersion);
  if (match && match[1] === today) {
    return `${today}.${Number(match[2]) + 1}`;
  }

  return `${today}.1`;
}

function buildEmptyStore(): PromptStoreFile {
  return { prompts: {} };
}

async function readStoreFile(): Promise<PromptStoreFile> {
  try {
    const raw = await readFile(resolveStorePath(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<PromptStoreFile>;
    return {
      prompts: parsed.prompts ?? {},
    };
  } catch {
    return buildEmptyStore();
  }
}

async function writeStoreFile(store: PromptStoreFile) {
  const storePath = resolveStorePath();
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), 'utf8');
}

function resolvePrompt(
  template: AgentPromptTemplate,
  entry?: PromptStoreEntry,
): ResolvedAgentPrompt {
  const baseVersion = buildBaseVersion(template);
  const history = [baseVersion, ...(entry?.versions ?? [])]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  const currentVersion =
    entry?.versions.find((version) => version.version === entry.currentVersion) ??
    entry?.versions[entry.versions.length - 1] ??
    baseVersion;

  return {
    ...template,
    version: currentVersion.version,
    purpose: currentVersion.purpose,
    systemPrompt: currentVersion.systemPrompt,
    userPromptTemplate: currentVersion.userPromptTemplate,
    baseVersion: template.version,
    updatedAt: currentVersion.updatedAt,
    updatedById: currentVersion.updatedById,
    isCustomized: Boolean(entry?.versions.length),
    history,
  };
}

export async function listResolvedAgentPrompts(agentId?: AgentId) {
  const store = await readStoreFile();

  return AGENT_PROMPTS
    .filter((prompt) => (agentId ? prompt.agentId === agentId : true))
    .map((prompt) => resolvePrompt(prompt, store.prompts[prompt.key]));
}

export async function resolveActivePromptForAgent(agentId: AgentId) {
  const template = getAgentPrompt(
    AGENT_PROMPTS.find((prompt) => prompt.agentId === agentId)?.key ??
      (() => {
        throw new Error(`No existe prompt base para ${agentId}`);
      })(),
  );
  const store = await readStoreFile();
  return resolvePrompt(template, store.prompts[template.key]);
}

export async function updateAgentPromptOverride(
  promptKey: string,
  input: UpdatePromptInput,
  actorUserId?: string,
) {
  const template = getAgentPrompt(promptKey);
  const store = await readStoreFile();
  const current = resolvePrompt(template, store.prompts[promptKey]);

  const nextRecord: PromptVersionRecord = {
    version: normalizeText(input.version) ?? buildNextVersion(current.version),
    purpose: normalizeText(input.purpose) ?? current.purpose,
    systemPrompt: normalizeText(input.systemPrompt) ?? current.systemPrompt,
    userPromptTemplate:
      normalizeText(input.userPromptTemplate) ?? current.userPromptTemplate,
    updatedAt: new Date().toISOString(),
    updatedById: actorUserId ?? null,
    note: normalizeText(input.note) ?? null,
  };

  const entry: PromptStoreEntry = store.prompts[promptKey] ?? {
    baseVersion: template.version,
    currentVersion: template.version,
    versions: [],
  };

  entry.baseVersion = template.version;
  entry.currentVersion = nextRecord.version;
  entry.versions = [
    ...entry.versions.filter((version) => version.version !== nextRecord.version),
    nextRecord,
  ];

  store.prompts[promptKey] = entry;
  await writeStoreFile(store);

  return resolvePrompt(template, entry);
}
