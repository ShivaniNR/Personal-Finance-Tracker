import { describe, it, expect, afterEach } from 'vitest';
import { createRequire } from 'module';

// Load the modules under test with a native require (not vitest's transform
// pipeline, which hangs on the large provider SDK dependency trees). A single
// native require cache is shared with index.js's internal requires, so the
// adapter instances compared below are identical.
const require = createRequire(import.meta.url);

// The adapters construct their SDK clients at require-time, which needs an API
// key present. Set dummy keys first (no network calls happen — getLLM only
// selects an adapter, it never calls chat()).
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-key';
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-key';

const { getLLM } = require('../index.js');
const gemini = require('../gemini.js');
const anthropic = require('../anthropic.js');

const originalProvider = process.env.LLM_PROVIDER;

describe('getLLM', () => {
  afterEach(() => {
    if (originalProvider === undefined) {
      delete process.env.LLM_PROVIDER;
    } else {
      process.env.LLM_PROVIDER = originalProvider;
    }
  });

  it('defaults to the Gemini adapter when LLM_PROVIDER is unset', () => {
    delete process.env.LLM_PROVIDER;
    expect(getLLM()).toBe(gemini);
  });

  it('returns the Anthropic adapter when LLM_PROVIDER=anthropic', () => {
    process.env.LLM_PROVIDER = 'anthropic';
    expect(getLLM()).toBe(anthropic);
  });

  it('is case-insensitive', () => {
    process.env.LLM_PROVIDER = 'GEMINI';
    expect(getLLM()).toBe(gemini);
  });

  it('throws a helpful error listing valid options for an unknown provider', () => {
    process.env.LLM_PROVIDER = 'openai';
    expect(() => getLLM()).toThrow(/Unknown LLM_PROVIDER "openai"/);
    expect(() => getLLM()).toThrow(/gemini, anthropic/);
  });

  it('returns an adapter exposing a chat function', () => {
    delete process.env.LLM_PROVIDER;
    expect(typeof getLLM().chat).toBe('function');
  });
});
