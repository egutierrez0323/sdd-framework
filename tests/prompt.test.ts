import { describe, it, expect } from 'vitest';
import { createProcessIO, isAffirmative } from '../src/utils/prompt.js';

describe('Prompt Module (CliIO)', () => {
  it('should report the TTY state of the process standard input', () => {
    expect(createProcessIO().isTTY).toBe(Boolean(process.stdin.isTTY));
  });

  it('should accept only explicit yes answers and default to no', () => {
    for (const answer of ['s', 'S', 'si', 'sí', 'Sí', 'y', 'yes', ' YES ']) {
      expect(isAffirmative(answer)).toBe(true);
    }
    for (const answer of ['', 'n', 'no', 'quizás', 'sii']) {
      expect(isAffirmative(answer)).toBe(false);
    }
  });
});
