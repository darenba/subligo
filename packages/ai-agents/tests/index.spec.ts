import { describe, expect, it } from 'vitest';

import {
  AGENT_FRAMEWORK_METADATA,
  AGENT_PROMPTS,
  AI_AGENTS,
  buildAgentRunDraft,
  getDefaultPromptForAgent,
} from '../src/index.js';

describe('ai agent registry', () => {
  it('keeps the seven required agents registered', () => {
    expect(AI_AGENTS).toHaveLength(7);
  });

  it('assigns one default prompt per agent', () => {
    for (const agent of AI_AGENTS) {
      const prompt = getDefaultPromptForAgent(agent.id);
      expect(prompt.agentId).toBe(agent.id);
      expect(prompt.version.length).toBeGreaterThan(0);
    }
  });

  it('creates queued run drafts with traceability metadata ready', () => {
    const run = buildAgentRunDraft('ejecutivo-comercial', {
      leadId: 'lead_123',
    });

    expect(run.status).toBe('QUEUED');
    expect(run.mode).toBe('SEMI_AUTOMATIC');
    expect(run.agentName).toBe('ejecutivo-comercial');
    expect(AGENT_FRAMEWORK_METADATA.executionPolicy.runsMustBeLogged).toBe(true);
    expect(AGENT_PROMPTS.length).toBe(7);
  });
});
