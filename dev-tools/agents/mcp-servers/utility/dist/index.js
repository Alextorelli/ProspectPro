#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { access, constants, readFile, writeFile } from "fs/promises";
import { convert } from "html-to-text";
import fetch from "node-fetch";
import { normalize, relative, resolve } from "path";
import { simpleGit } from "simple-git";
const ALLOWED_PATH = process.env.ALLOWED_PATH || "/workspaces/ProspectPro";
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
const server = new Server({
    name: "prospectpro-utility-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
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
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        let result;
        switch (name) {
            case "fetch":
                result = await handleFetch(args);
                break;
            case "fs_read":
                result = await handleFSRead(args);
                break;
            case "fs_write":
                result = await handleFSWrite(args);
                break;
            case "git_status":
                result = await handleGitStatus(args);
                break;
            case "time_now":
                result = await handleTimeNow(args);
                break;
            case "time_convert":
                result = await handleTimeConvert(args);
                break;
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
        return {
            content: [
                {
                    type: "text",
                    text: result,
                },
            ],
        };
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
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("ProspectPro Utility MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map