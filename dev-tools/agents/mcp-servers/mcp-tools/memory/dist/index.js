#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { buildToolList, handleToolCall, initialiseKnowledgeGraph, writeSnapshot, } from "./lib.js";
async function runServer() {
    const { manager, memoryFilePath } = await initialiseKnowledgeGraph();
    const server = new Server({
        name: "memory-server",
        version: "0.7.0",
    }, {
        capabilities: {
            tools: {},
        },
    });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: buildToolList(),
    }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        try {
            const result = await handleToolCall(manager, request.params.name, request.params.arguments);
            if (request.params.name === "read_graph") {
                await writeSnapshot(manager);
            }
            return {
                content: [
                    {
                        type: "text",
                        text: typeof result === "string"
                            ? result
                            : JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error occurred";
            return {
                content: [
                    {
                        type: "text",
                        text: `Error handling tool ${request.params.name}: ${message}`,
                    },
                ],
                isError: true,
            };
        }
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`ProspectPro Memory MCP Server running on stdio (memory file: ${memoryFilePath})`);
}
runServer().catch((error) => {
    console.error("Fatal error running memory MCP server:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map