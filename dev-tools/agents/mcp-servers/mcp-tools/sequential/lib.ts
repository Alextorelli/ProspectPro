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
}

const DEFAULT_LOG_PATH = path.resolve(
  process.cwd(),
  process.env.SEQUENTIAL_LOG_PATH ||
    "dev-tools/agents/context/session_store/sequential-thoughts.jsonl"
);

export class SequentialThinkingServer {
  private readonly thoughtHistory: ThoughtData[] = [];
  private readonly branches: Record<string, ThoughtData[]> = {};
  private readonly disableThoughtLogging: boolean;
  private readonly logPath: string;
  private logPrepared = false;

  constructor(options: SequentialThinkingOptions = {}) {
    this.disableThoughtLogging =
      options.disableThoughtLogging ||
      (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true";
    this.logPath = path.resolve(options.logPath ?? DEFAULT_LOG_PATH);
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
    const payload = {
      timestamp: new Date().toISOString(),
      ...thought,
    } satisfies ThoughtData & { timestamp: string };

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

  public async processThought(
    input: unknown
  ): Promise<{
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

  // Testing helper to reset state without touching the log file.
  public reset(): void {
    this.thoughtHistory.length = 0;
    Object.keys(this.branches).forEach((key) => delete this.branches[key]);
  }
}

export function createSequentialThinkingServer(
  options: SequentialThinkingOptions = {}
): SequentialThinkingServer {
  return new SequentialThinkingServer(options);
}
