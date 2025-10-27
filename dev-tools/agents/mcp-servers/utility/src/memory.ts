import { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  access,
  appendFile,
  mkdir,
  readFile,
  rename,
  writeFile,
} from "fs/promises";
import path from "path";

export interface Entity {
  name: string;
  entityType: string;
  observations: string[];
}

export interface Relation {
  from: string;
  to: string;
  relationType: string;
}

export interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
}

export interface MemoryToolOptions {
  memoryFilePath?: string;
  ttlSeconds?: number;
  getTimestamp?: () => Promise<string> | string;
}

const DEFAULT_MEMORY_PATH = path.resolve(
  process.cwd(),
  process.env.MCP_MEMORY_FILE_PATH ||
    process.env.MEMORY_FILE_PATH ||
    "dev-tools/agents/context/session_store/memory.jsonl"
);

async function resolveMemoryFilePath(
  options: MemoryToolOptions = {}
): Promise<string> {
  const resolvedPath = path.resolve(
    options.memoryFilePath ?? DEFAULT_MEMORY_PATH
  );
  await mkdir(path.dirname(resolvedPath), { recursive: true });

  if (resolvedPath.endsWith(".jsonl")) {
    const legacyPath = resolvedPath.slice(0, -1);
    try {
      await access(legacyPath);
      try {
        await access(resolvedPath);
      } catch {
        await rename(legacyPath, resolvedPath);
      }
    } catch {
      // legacy file not found; ignore
    }
    return resolvedPath;
  }

  const jsonlPath = `${resolvedPath}.jsonl`;
  await mkdir(path.dirname(jsonlPath), { recursive: true });
  return jsonlPath;
}






}

export async function initialiseKnowledgeGraph(
  options: MemoryToolOptions = {}
): Promise<{ manager: KnowledgeGraphManager; memoryFilePath: string }> {
  const memoryFilePath = await resolveMemoryFilePath(options);
  return {
    manager: new KnowledgeGraphManager(memoryFilePath, options),
    memoryFilePath,
  } as const;
}

export function buildMemoryToolList(): Tool[] {
  const tools = [
    {
      name: "create_entities",
      description: "Create multiple new entities in the knowledge graph",
      inputSchema: {
        type: "object",
        properties: {
          entities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                entityType: { type: "string" },
                observations: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["name", "entityType", "observations"],
              additionalProperties: false,
            },
          },
        },
        required: ["entities"],
        additionalProperties: false,
      },
    },
    {
      name: "create_relations",
      description:
        "Create multiple new relations between entities in the knowledge graph. Relations should be in active voice",
      inputSchema: {
        type: "object",
        properties: {
          relations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                from: { type: "string" },
                to: { type: "string" },
                relationType: { type: "string" },
              },
              required: ["from", "to", "relationType"],
              additionalProperties: false,
            },
          },
        },
        required: ["relations"],
        additionalProperties: false,
      },
    },
    {
      name: "add_observations",
      description:
        "Add new observations to existing entities in the knowledge graph",
      inputSchema: {
        type: "object",
        properties: {
          observations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                entityName: { type: "string" },
                contents: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["entityName", "contents"],
              additionalProperties: false,
            },
          },
        },
        required: ["observations"],
        additionalProperties: false,
      },
    },
    {
      name: "delete_entities",
      description:
        "Delete multiple entities and their associated relations from the knowledge graph",
      inputSchema: {
        type: "object",
        properties: {
          entityNames: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["entityNames"],
        additionalProperties: false,
      },
    },
    {
      name: "delete_observations",
      description:
        "Delete specific observations from entities in the knowledge graph",
      inputSchema: {
        type: "object",
        properties: {
          deletions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                entityName: { type: "string" },
                observations: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["entityName", "observations"],
              additionalProperties: false,
            },
          },
        },
        required: ["deletions"],
        additionalProperties: false,
      },
    },
    {
      name: "delete_relations",
      description: "Delete multiple relations from the knowledge graph",
      inputSchema: {
        type: "object",
        properties: {
          relations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                from: { type: "string" },
                to: { type: "string" },
                relationType: { type: "string" },
              },
              required: ["from", "to", "relationType"],
              additionalProperties: false,
            },
          },
        },
        required: ["relations"],
        additionalProperties: false,
      },
    },
    {
      name: "read_graph",
      description: "Read the entire knowledge graph",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
    {
      name: "search_nodes",
      description: "Search for nodes in the knowledge graph based on a query",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
    {
      name: "open_nodes",
      description: "Open specific nodes in the knowledge graph by their names",
      inputSchema: {
        type: "object",
        properties: {
          names: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["names"],
        additionalProperties: false,
      },
    },
  ] satisfies Tool[];

  return tools;
}

export async function executeMemoryTool(
  manager: KnowledgeGraphManager,
  toolName: string,
  args: Record<string, unknown> | undefined
): Promise<unknown> {
  switch (toolName) {
    case "create_entities":
      return manager.createEntities((args?.entities ?? []) as Entity[]);
    case "create_relations":
      return manager.createRelations((args?.relations ?? []) as Relation[]);
    case "add_observations":
      return manager.addObservations(
        (args?.observations ?? []) as {
          entityName: string;
          contents: string[];
        }[]
      );
    case "delete_entities":
      await manager.deleteEntities((args?.entityNames ?? []) as string[]);
      return { status: "ok" };
    case "delete_observations":
      await manager.deleteObservations(
        (args?.deletions ?? []) as {
          entityName: string;
          observations: string[];
        }[]
      );
      return { status: "ok" };
    case "delete_relations":
      await manager.deleteRelations((args?.relations ?? []) as Relation[]);
      return { status: "ok" };
    case "read_graph": {
      const graph = await manager.readGraph();
      await manager.appendSnapshot();
      return graph;
    }
    case "search_nodes":
      return manager.searchNodes(String(args?.query ?? ""));
    case "open_nodes":
      return manager.openNodes((args?.names ?? []) as string[]);
    default:
      throw new Error(`Unknown memory tool: ${toolName}`);
  }
}
