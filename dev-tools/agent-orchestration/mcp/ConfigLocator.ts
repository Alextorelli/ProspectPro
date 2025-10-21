import { existsSync, readFileSync } from "fs";
import { join } from "path";

export interface ConfigResult {
  config: any;
  source: string;
  warnings: string[];
}

export class ConfigLocator {
  private readonly primaryPath: string;
  private readonly fallbackPath: string;

  constructor(
    workspaceRoot: string,
    primaryPath: string = ".vscode/mcp_config.json",
    fallbackPath: string = "config/mcp-config.json"
  ) {
    this.primaryPath = join(workspaceRoot, primaryPath);
    this.fallbackPath = join(workspaceRoot, fallbackPath);
  }

  loadConfig(): ConfigResult {
    const warnings: string[] = [];

    // Try primary path first
    if (existsSync(this.primaryPath)) {
      try {
        const config = JSON.parse(readFileSync(this.primaryPath, "utf-8"));
        return { config, source: this.primaryPath, warnings };
      } catch (error) {
        warnings.push(
          `Failed to parse primary config at ${this.primaryPath}: ${
            (error as Error).message
          }`
        );
      }
    } else {
      warnings.push(`Primary config file not found at ${this.primaryPath}`);
    }

    // Fallback to secondary path
    if (existsSync(this.fallbackPath)) {
      try {
        const config = JSON.parse(readFileSync(this.fallbackPath, "utf-8"));
        warnings.push(`Using fallback config from ${this.fallbackPath}`);
        return { config, source: this.fallbackPath, warnings };
      } catch (error) {
        warnings.push(
          `Failed to parse fallback config at ${this.fallbackPath}: ${
            (error as Error).message
          }`
        );
      }
    } else {
      warnings.push(`Fallback config file not found at ${this.fallbackPath}`);
    }

    // No valid config found
    throw new Error(
      `No valid MCP config found. Checked: ${this.primaryPath}, ${
        this.fallbackPath
      }. Warnings: ${warnings.join("; ")}`
    );
  }
}
