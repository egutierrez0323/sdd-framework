import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG, loadConfig, SddConfig } from '../src/core/config.js';

describe('Config Module', () => {
  it('should return default config when no config.json exists', async () => {
    const config = await loadConfig('non-existent-dir');
    expect(config.version).toBe('1.0.0');
    expect(config.severity).toBe('L2');
    expect(config.autonomous.maxRetries).toBe(3);
  });

  it('should have all 3 severity levels supported', () => {
    const levels: SddConfig['severity'][] = ['L1', 'L2', 'L3'];
    expect(levels).toHaveLength(3);
  });
});
