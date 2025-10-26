import { describe, it, expect, beforeEach } from '@jest/globals';
import { SequentialThinkingServer } from '../lib.js';
describe('SequentialThinkingServer', () => {
    let server;
    beforeEach(() => {
        server = new SequentialThinkingServer();
    });
    it('should process a basic thought', () => {
        const input = {
            thought: 'This is a test thought',
            nextThoughtNeeded: true,
            thoughtNumber: 1,
            totalThoughts: 3
        };
        const result = server.processThought(input);
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        expect(result.content[0].type).toBe('text');
        const parsedContent = JSON.parse(result.content[0].text);
        expect(parsedContent.thoughtNumber).toBe(1);
        expect(parsedContent.totalThoughts).toBe(3);
        expect(parsedContent.nextThoughtNeeded).toBe(true);
    });
    it('should auto-adjust totalThoughts if thoughtNumber exceeds it', () => {
        const input = {
            thought: 'This thought exceeds the total',
            nextThoughtNeeded: false,
            thoughtNumber: 5,
            totalThoughts: 3
        };
        const result = server.processThought(input);
        const parsedContent = JSON.parse(result.content[0].text);
        expect(parsedContent.totalThoughts).toBe(5);
    });
    it('should handle revision thoughts', () => {
        const input = {
            thought: 'This revises a previous thought',
            nextThoughtNeeded: true,
            thoughtNumber: 2,
            totalThoughts: 4,
            isRevision: true,
            revisesThought: 1
        };
        const result = server.processThought(input);
        expect(result).toBeDefined();
        expect(result.isError).toBeUndefined();
    });
    it('should handle branching thoughts', () => {
        const input = {
            thought: 'This branches from another thought',
            nextThoughtNeeded: true,
            thoughtNumber: 3,
            totalThoughts: 5,
            branchFromThought: 2,
            branchId: 'branch-a'
        };
        const result = server.processThought(input);
        const parsedContent = JSON.parse(result.content[0].text);
        expect(parsedContent.branches).toContain('branch-a');
    });
    it('should validate required fields', () => {
        const input = {
            thought: 'Valid thought',
            // Missing required fields
        };
        const result = server.processThought(input);
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('error');
    });
});
//# sourceMappingURL=lib.test.js.map