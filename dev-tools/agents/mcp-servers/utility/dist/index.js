#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { access, constants, readFile, writeFile } from "fs/promises";
import { convert } from "html-to-text";
import fetch from "node-fetch";
import { normalize, relative, resolve } from "path";
import { simpleGit } from "simple-git";
import { buildMemoryToolList, executeMemoryTool, initialiseKnowledgeGraph, } from "./memory.js";
import { SEQUENTIAL_THINKING_TOOL, createSequentialThinkingEngine, } from "./sequential.js";
const ALLOWED_PATH = process.env.ALLOWED_PATH || "/workspaces/ProspectPro";
const CLI_ARGS = new Set(process.argv.slice(2));
function safeResolve(requestedPath) {
    const normalized = normalize(requestedPath);
    const resolved = resolve(ALLOWED_PATH, normalized);
    if (!resolved.startsWith(ALLOWED_PATH)) {
        throw new Error(`Access denied: path outside allowed directory`);
    }
    return resolved;
}
async function handleFetch(options) {
    const { url, method = "GET", headers = {}, raw = false } = options;
    const response = await fetch(url, {
        method,
        headers: {
            "User-Agent": "ProspectPro-Utility-MCP/1.0",
            ...headers,
        },
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();
    if (raw || !contentType.includes("text/html")) {
        return body;
    }
    return convert(body, {
        wordwrap: 120,
        selectors: [
            { selector: "a", options: { ignoreHref: false } },
            { selector: "img", format: "skip" },
        ],
    });
}
async function handleFSRead(options) {
    const safePath = safeResolve(options.file_path);
    await access(safePath, constants.R_OK);
    const content = await readFile(safePath, "utf-8");
    return content;
}
async function handleFSWrite(options) {
    const safePath = safeResolve(options.file_path);
    await writeFile(safePath, options.content, "utf-8");
    return `Successfully wrote ${options.content.length} bytes to ${relative(ALLOWED_PATH, safePath)}`;
}
async function handleGitStatus(options) {
    const repoPath = options.repo_path || ALLOWED_PATH;
    const safePath = safeResolve(repoPath);
    const git = simpleGit(safePath);
    const status = await git.status();
    return JSON.stringify({
        branch: status.current,
        ahead: status.ahead,
        behind: status.behind,
        modified: status.modified,
        created: status.created,
        deleted: status.deleted,
        renamed: status.renamed,
        staged: status.staged,
        conflicted: status.conflicted,
    }, null, 2);
}
async function handleTimeNow(options) {
    const timezone = options.timezone || "UTC";
    const now = new Date();
    const formatted = now.toLocaleString("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
    return JSON.stringify({
        timestamp: now.toISOString(),
        timezone,
        formatted,
        unix: Math.floor(now.getTime() / 1000),
    }, null, 2);
}
async function handleTimeConvert(options) {
    const { time, source_timezone, target_timezone } = options;
    const sourceDate = new Date(time);
    if (isNaN(sourceDate.getTime())) {
        throw new Error(`Invalid time format: ${time}`);
    }
    const formatted = sourceDate.toLocaleString("en-US", {
        timeZone: target_timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
    return JSON.stringify({
        source_time: time,
        source_timezone,
        target_timezone,
        converted: formatted,
        iso: sourceDate.toISOString(),
    }, null, 2);
}
const BASE_TOOL_DEFINITIONS = [
    {
        name: "fetch",
        description: "Fetch content from a URL with optional HTML-to-text conversion",
        inputSchema: {
            type: "object",
            properties: {
                url: {
                    type: "string",
                    description: "URL to fetch",
                },
                method: {
                    type: "string",
                    description: "HTTP method (default: GET)",
                    enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
                },
                headers: {
                    type: "object",
                    description: "Optional HTTP headers",
                    additionalProperties: { type: "string" },
                },
                raw: {
                    type: "boolean",
                    description: "Return raw response without HTML conversion",
                },
            },
            required: ["url"],
        },
    },
    {
        name: "fs_read",
        description: "Read a file from the allowed workspace path",
        inputSchema: {
            type: "object",
            properties: {
                file_path: {
                    type: "string",
                    description: "Path to file (relative to workspace root)",
                },
            },
            required: ["file_path"],
        },
    },
    {
        name: "fs_write",
        description: "Write content to a file in the allowed workspace path",
        inputSchema: {
            type: "object",
            properties: {
                file_path: {
                    type: "string",
                    description: "Path to file (relative to workspace root)",
                },
                content: {
                    type: "string",
                    description: "Content to write",
                },
            },
            required: ["file_path", "content"],
        },
    },
    {
        name: "git_status",
        description: "Get git repository status",
        inputSchema: {
            type: "object",
            properties: {
                repo_path: {
                    type: "string",
                    description: "Path to git repository (default: workspace root)",
                },
            },
        },
    },
    {
        name: "time_now",
        description: "Get current time in specified timezone",
        inputSchema: {
            type: "object",
            properties: {
                timezone: {
                    type: "string",
                    description: "IANA timezone name (default: UTC)",
                },
            },
        },
    },
    {
        name: "time_convert",
        description: "Convert time between timezones",
        inputSchema: {
            type: "object",
            properties: {
                time: {
                    type: "string",
                    description: "Time to convert (ISO 8601 format)",
                },
                source_timezone: {
                    type: "string",
                    description: "Source IANA timezone",
                },
                target_timezone: {
                    type: "string",
                    description: "Target IANA timezone",
                },
            },
            required: ["time", "source_timezone", "target_timezone"],
        },
    },
];
const BASE_TOOL_HANDLERS = {
    fetch: (args) => handleFetch(args),
    fs_read: (args) => handleFSRead(args),
    fs_write: (args) => handleFSWrite(args),
    git_status: (args) => handleGitStatus(args),
    time_now: (args) => handleTimeNow(args),
    time_convert: (args) => handleTimeConvert(args),
};
async function createRuntime(options = {}) {
    const { manager, memoryFilePath } = await initialiseKnowledgeGraph();
    const sequentialEngine = createSequentialThinkingEngine(options.sequential);
    const memoryTools = buildMemoryToolList();
    const memoryToolNames = new Set(memoryTools.map((tool) => tool.name));
    return {
        memoryManager: manager,
        memoryFilePath,
        sequentialEngine,
        memoryTools,
        memoryToolNames,
    };
}
function formatResult(result) {
    return typeof result === "string" ? result : JSON.stringify(result, null, 2);
}
async function runServer() {
    const runtime = await createRuntime();
    const server = new Server({
        name: "prospectpro-utility-mcp",
        version: "1.1.0",
    }, {
        capabilities: {
            tools: {},
        },
    });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [
            ...BASE_TOOL_DEFINITIONS,
            ...runtime.memoryTools,
            SEQUENTIAL_THINKING_TOOL,
        ],
    }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        try {
            const baseHandler = BASE_TOOL_HANDLERS[name];
            if (baseHandler) {
                const result = await baseHandler(args);
                return {
                    content: [
                        {
                            type: "text",
                            text: result,
                        },
                    ],
                };
            }
            if (runtime.memoryToolNames.has(name)) {
                const result = await executeMemoryTool(runtime.memoryManager, name, args ?? undefined);
                return {
                    content: [
                        {
                            type: "text",
                            text: formatResult(result),
                        },
                    ],
                };
            }
            if (name === SEQUENTIAL_THINKING_TOOL.name) {
                return runtime.sequentialEngine.processThought(args);
            }
            throw new Error(`Unknown tool: ${name}`);
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`ProspectPro Utility MCP Server running on stdio (memory file: ${runtime.memoryManager.filePath})`);
}
async function runSelfTest() {
    const runtime = await createRuntime({
        sequential: { disableThoughtLogging: true },
    });
    await runtime.memoryManager.readGraph();
    await runtime.sequentialEngine.selfTest();
    console.log("Utility MCP self-test completed successfully");
}
async function bootstrap() {
    if (CLI_ARGS.has("--test")) {
        await runSelfTest();
        return;
    }
    await runServer();
}
bootstrap().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map