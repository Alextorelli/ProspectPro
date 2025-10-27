import { Tool } from "@modelcontextprotocol/sdk/types.js";
import chalk from "chalk";
import { appendFile, mkdir } from "fs/promises";
import path from "path";

export interface ThoughtData {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  nextThoughtNeeded: boolean;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
}

export interface SequentialThinkingOptions {
  disableThoughtLogging?: boolean;
  logPath?: string;
  agentId?: string;
  environment?: string;
  checkpointId?: string;
  scratchpadRetention?: boolean;
  getTimestamp?: () => Promise<string> | string;
}

const DEFAULT_LOG_PATH = path.resolve(
  process.cwd(),
  process.env.SEQUENTIAL_LOG_PATH ||
  "dev-tools/workspace/context/session_store/sequential/memory.jsonl"
);

const SEQUENTIAL_THINKING_TOOL: Tool = {
  name: "sequential_thinking",
  description: `A detailed tool for dynamic and reflective problem-solving through thoughts.
This tool helps analyze problems through a flexible thinking process that can adapt and evolve.
Each thought can build on, question, or revise previous insights as understanding deepens.

When to use this tool:
- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems where the full scope might not be clear initially
- Problems that require a multi-step solution
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs to be filtered out

Key features:
- You can adjust total_thoughts up or down as you progress
- You can question or revise previous thoughts
- You can add more thoughts even after reaching what seemed like the end
- You can express uncertainty and explore alternative approaches
- Not every thought needs to build linearly - you can branch or backtrack
- Generates a solution hypothesis
- Verifies the hypothesis based on the Chain of Thought steps
- Repeats the process until satisfied
- Provides a correct answer

Parameters explained:
- thought: Your current thinking step, which can include:
  * Regular analytical steps
  * Revisions of previous thinking
  * Questions about previous decisions
  * Realizations about needing more analysis
  * Changes in approach
  * Hypothesis generation
  * Hypothesis verification
- next_thought_needed: True if you need more thinking, even if at what seemed like the end
- thought_number: Current number in sequence (can go beyond initial total if needed)
- total_thoughts: Current estimate of thoughts needed (can be adjusted up/down)
- is_revision: A boolean indicating if this thought revises previous thinking
- revises_thought: If is_revision is true, which thought number is being reconsidered
- branch_from_thought: If branching, which thought number is the branching point
- branch_id: Identifier for the current branch (if any)
- needs_more_thoughts: If reaching end but realizing more thoughts needed

You should:
1. Start with an initial estimate of needed thoughts, but be ready to adjust
2. Feel free to question or revise previous thoughts
3. Don't hesitate to add more thoughts if needed, even at the "end"
4. Express uncertainty when present
5. Mark thoughts that revise previous thinking or branch into new paths
6. Ignore information that is irrelevant to the current step
7. Generate a solution hypothesis when appropriate
8. Verify the hypothesis based on the Chain of Thought steps
9. Repeat the process until satisfied with the solution
10. Provide a single, ideally correct answer as the final output
11. Only set next_thought_needed to false when truly done and a satisfactory answer is reached`,
  inputSchema: {
    type: "object",
    properties: {
      thought: {
        type: "string",
        description: "Your current thinking step",
      },
      nextThoughtNeeded: {
        type: "boolean",
        description: "Whether another thought step is needed",
      },
      thoughtNumber: {
        type: "integer",
        description: "Current thought number (numeric value, e.g., 1, 2, 3)",
        minimum: 1,
      },
      totalThoughts: {
        type: "integer",
        description:
          "Estimated total thoughts needed (numeric value, e.g., 5, 10)",
        minimum: 1,
      },
      isRevision: {
        type: "boolean",
        description: "Whether this revises previous thinking",
      },
      revisesThought: {
        type: "integer",
        description: "Which thought is being reconsidered",
        minimum: 1,
      },
      branchFromThought: {
        type: "integer",
        description: "Branching point thought number",
        minimum: 1,
      },
      branchId: {
        type: "string",
        description: "Branch identifier",
      },
      needsMoreThoughts: {
        type: "boolean",
        description: "If more thoughts are needed",
      },
    },
    required: [
      "thought",
      "nextThoughtNeeded",
      "thoughtNumber",
      "totalThoughts",
    ],
  },
};

export class SequentialThinkingEngine {
  private readonly thoughtHistory: ThoughtData[] = [];
  private readonly branches: Record<string, ThoughtData[]> = {};
  private readonly logPath: string;
  private readonly agentId?: string;
  private readonly environment?: string;
  private readonly checkpointId?: string;
  private readonly scratchpadRetention: boolean;
  private readonly disableThoughtLogging: boolean;
  private readonly getTimestamp?: () => Promise<string> | string;
  private logPrepared = false;

  constructor(options: SequentialThinkingOptions = {}) {
    this.logPath = path.resolve(options.logPath ?? DEFAULT_LOG_PATH);
    this.agentId = options.agentId;
    this.environment = options.environment;
    this.checkpointId = options.checkpointId;
    this.scratchpadRetention = options.scratchpadRetention !== false;
    this.getTimestamp = options.getTimestamp;
    this.disableThoughtLogging =
      options.disableThoughtLogging ||
      !this.scratchpadRetention ||
      (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true";
  }

  get tool(): Tool {
    return SEQUENTIAL_THINKING_TOOL;
  }

  private async prepareLogFile(): Promise<void> {
    if (this.logPrepared || this.disableThoughtLogging) {
      return;
    }

    const directory = path.dirname(this.logPath);
    await mkdir(directory, { recursive: true });
    this.logPrepared = true;
  }

  private async appendThought(thought: ThoughtData): Promise<void> {
    if (this.disableThoughtLogging) {
      return;
    }

    await this.prepareLogFile();
    let timestamp: string;
    if (this.getTimestamp) {
      timestamp =
        typeof this.getTimestamp === "function"
          ? await this.getTimestamp()
          : this.getTimestamp;
    } else {
      timestamp = new Date().toISOString();
    }
    const payload = {
      timestamp,
      ...thought,
      agentId: this.agentId,
      environment: this.environment,
      checkpointId: this.checkpointId,
    };

    await appendFile(this.logPath, `${JSON.stringify(payload)}\n`);
  }

  private validateThoughtData(input: unknown): ThoughtData {
    const data = input as Record<string, unknown>;

    if (typeof data.thought !== "string" || data.thought.trim().length === 0) {
      throw new Error("Invalid thought: must be a non-empty string");
    }

    if (typeof data.thoughtNumber !== "number" || data.thoughtNumber < 1) {
      throw new Error("Invalid thoughtNumber: must be a positive number");
    }

    if (typeof data.totalThoughts !== "number" || data.totalThoughts < 1) {
      throw new Error("Invalid totalThoughts: must be a positive number");
    }

    if (typeof data.nextThoughtNeeded !== "boolean") {
      throw new Error("Invalid nextThoughtNeeded: must be a boolean");
    }

    const buildOptionalNumber = (key: string): number | undefined => {
      const value = data[key];
      if (typeof value === "number") {
        return value;
      }
      return undefined;
    };

    return {
      thought: data.thought,
      thoughtNumber: data.thoughtNumber,
      totalThoughts: data.totalThoughts,
      nextThoughtNeeded: data.nextThoughtNeeded,
      isRevision:
        typeof data.isRevision === "boolean" ? data.isRevision : undefined,
      revisesThought: buildOptionalNumber("revisesThought"),
      branchFromThought: buildOptionalNumber("branchFromThought"),
      branchId: typeof data.branchId === "string" ? data.branchId : undefined,
      needsMoreThoughts:
        typeof data.needsMoreThoughts === "boolean"
          ? data.needsMoreThoughts
          : undefined,
    };
  }

  private formatThought(thoughtData: ThoughtData): string {
    const {
      thoughtNumber,
      totalThoughts,
      thought,
      isRevision,
      revisesThought,
      branchFromThought,
      branchId,
    } = thoughtData;

    let prefix = "";
    let context = "";

    if (isRevision) {
      prefix = chalk.yellow("🔄 Revision");
      context = revisesThought ? ` (revising thought ${revisesThought})` : "";
    } else if (branchFromThought) {
      prefix = chalk.green("🌿 Branch");
      context = ` (from thought ${branchFromThought}${
        branchId ? `, ID: ${branchId}` : ""
      })`;
    } else {
      prefix = chalk.blue("💭 Thought");
    }

    const header = `${prefix} ${thoughtNumber}/${totalThoughts}${context}`;
    const width = Math.max(header.length, thought.length) + 4;
    const border = "─".repeat(width);

    const paddedHeader = header.padEnd(width - 2, " ");
    const paddedThought = thought.padEnd(width - 2, " ");

    return [
      `┌${border}┐`,
      `│ ${paddedHeader} │`,
      `├${border}┤`,
      `│ ${paddedThought} │`,
      `└${border}┘`,
    ].join("\n");
  }

  async processThought(input: unknown): Promise<{
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
  }> {
    try {
      const validatedInput = this.validateThoughtData(input);

      if (validatedInput.thoughtNumber > validatedInput.totalThoughts) {
        validatedInput.totalThoughts = validatedInput.thoughtNumber;
      }

      this.thoughtHistory.push(validatedInput);

      if (validatedInput.branchFromThought && validatedInput.branchId) {
        if (!this.branches[validatedInput.branchId]) {
          this.branches[validatedInput.branchId] = [];
        }
        this.branches[validatedInput.branchId].push(validatedInput);
      }

      if (!this.disableThoughtLogging) {
        const formattedThought = this.formatThought(validatedInput);
        console.error(formattedThought);
      }

      await this.appendThought(validatedInput);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                thoughtNumber: validatedInput.thoughtNumber,
                totalThoughts: validatedInput.totalThoughts,
                nextThoughtNeeded: validatedInput.nextThoughtNeeded,
                branches: Object.keys(this.branches),
                thoughtHistoryLength: this.thoughtHistory.length,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : String(error),
                status: "failed",
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }

  async selfTest(): Promise<void> {
    await this.processThought({
      thought: "Utility MCP sequential thinking self-test",
      nextThoughtNeeded: false,
      thoughtNumber: 1,
      totalThoughts: 1,
    });
  }
}

export function createSequentialThinkingEngine(
  options: SequentialThinkingOptions = {}
): SequentialThinkingEngine {
  return new SequentialThinkingEngine(options);
}

export { SEQUENTIAL_THINKING_TOOL };
