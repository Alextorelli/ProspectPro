import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

export interface ChatModeManifest {
  name: string;
  content: string;
  path: string;
}

export class ChatModeLoader {
  private readonly basePath: string;

  constructor(basePath: string = ".github/chatmodes") {
    this.basePath = basePath;
  }

  loadManifests(workspaceRoot: string): {
    manifests: ChatModeManifest[];
    warnings: string[];
  } {
    const fullPath = join(workspaceRoot, this.basePath);
    const warnings: string[] = [];
    const manifests: ChatModeManifest[] = [];

    if (!existsSync(fullPath)) {
      warnings.push(`Chat modes directory not found at ${fullPath}`);
      return { manifests, warnings };
    }

    try {
      const files = readdirSync(fullPath).filter((file) =>
        file.endsWith(".chatmode.md")
      );

      for (const file of files) {
        const filePath = join(fullPath, file);
        try {
          const content = readFileSync(filePath, "utf-8");
          const name = file.replace(".chatmode.md", "");
          manifests.push({ name, content, path: filePath });
        } catch (error) {
          warnings.push(
            `Failed to load chat mode manifest ${file}: ${error.message}`
          );
        }
      }
    } catch (error) {
      warnings.push(
        `Failed to read chat modes directory ${fullPath}: ${error.message}`
      );
    }

    return { manifests, warnings };
  }
}
