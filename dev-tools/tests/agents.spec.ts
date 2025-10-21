import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const chatmodesDir = path.resolve(__dirname, '../../.github/chatmodes');

describe('Chatmodes prompt files', () => {
  it('should contain guardrails and hyperlinks', () => {
    const files = fs.readdirSync(chatmodesDir).filter(f => f.endsWith('.chatmode.md'));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const content = fs.readFileSync(path.join(chatmodesDir, file), 'utf8');
      expect(content).toMatch(/guardrail|guardrails/i);
      expect(content).toMatch(/https?:\/\//i);
    }
  });
});
