export class KnowledgeGraphManager {
  private readonly ttlSeconds?: number;
  private readonly getTimestamp?: () => Promise<string> | string;
  constructor(
    private readonly memoryFilePath: string,
    options: MemoryToolOptions = {}
  ) {
    this.ttlSeconds = options.ttlSeconds;
    this.getTimestamp = options.getTimestamp;
  }

  get filePath(): string {
    return this.memoryFilePath;
  }

  private async loadGraph(): Promise<KnowledgeGraph> {
    try {
      const fileContents = await readFile(this.memoryFilePath, "utf-8");
      const lines = fileContents
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const now = Date.now();
      const graph: KnowledgeGraph = { entities: [], relations: [] };

      for (const line of lines) {
        const item = JSON.parse(line);
        // TTL/retention: prune expired entities/relations
        if (item.expiresAt && Date.parse(item.expiresAt) < now) continue;
        if (
          item.ttlSeconds &&
          item.createdAt &&
          Date.parse(item.createdAt) + item.ttlSeconds * 1000 < now
        )
          continue;
        if (item.type === "entity") {
          graph.entities.push({
            name: item.name,
            entityType: item.entityType,
            observations: item.observations ?? [],
          });
        } else if (item.type === "relation") {
          graph.relations.push({
            from: item.from,
            to: item.to,
            relationType: item.relationType,
          });
        }
      }

      return graph;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return { entities: [], relations: [] };
      }
      throw error;
    }
  }

  private async saveGraph(graph: KnowledgeGraph): Promise<void> {
    const lines = [
      ...graph.entities.map((entity) =>
        JSON.stringify({
          type: "entity",
          name: entity.name,
          entityType: entity.entityType,
          observations: entity.observations,
        })
      ),
      ...graph.relations.map((relation) =>
        JSON.stringify({
          type: "relation",
          from: relation.from,
          to: relation.to,
          relationType: relation.relationType,
        })
      ),
    ];

    await writeFile(this.memoryFilePath, lines.join("\n"));
  }

  private ensureEntityExists(
    graph: KnowledgeGraph,
    entityName: string
  ): Entity {
    const entity = graph.entities.find((item) => item.name === entityName);
    if (!entity) {
      throw new Error(`Entity with name ${entityName} not found`);
    }
    return entity;
  }

  async createEntities(entities: Entity[]): Promise<Entity[]> {
    const graph = await this.loadGraph();
    const newEntities = entities.filter(
      (entity) =>
        !graph.entities.some((existing) => existing.name === entity.name)
    );
    graph.entities.push(...newEntities);
    await this.saveGraph(graph);
    return newEntities;
  }

  async createRelations(relations: Relation[]): Promise<Relation[]> {
    const graph = await this.loadGraph();
    const newRelations = relations.filter(
      (relation) =>
        !graph.relations.some(
          (existing) =>
            existing.from === relation.from &&
            existing.to === relation.to &&
            existing.relationType === relation.relationType
        )
    );
    graph.relations.push(...newRelations);
    await this.saveGraph(graph);
    return newRelations;
  }

  async addObservations(
    observations: { entityName: string; contents: string[] }[]
  ): Promise<{ entityName: string; addedObservations: string[] }[]> {
    const graph = await this.loadGraph();
    const results: { entityName: string; addedObservations: string[] }[] = [];

    for (const observation of observations) {
      const entity = this.ensureEntityExists(graph, observation.entityName);
      const added = observation.contents.filter(
        (content) => !entity.observations.includes(content)
      );
      entity.observations.push(...added);
      results.push({
        entityName: observation.entityName,
        addedObservations: added,
      });
    }

    await this.saveGraph(graph);
    return results;
  }

  async deleteEntities(entityNames: string[]): Promise<void> {
    const graph = await this.loadGraph();
    graph.entities = graph.entities.filter(
      (entity) => !entityNames.includes(entity.name)
    );
    graph.relations = graph.relations.filter(
      (relation) =>
        !entityNames.includes(relation.from) &&
        !entityNames.includes(relation.to)
    );
    await this.saveGraph(graph);
  }

  async deleteObservations(
    deletions: { entityName: string; observations: string[] }[]
  ): Promise<void> {
    const graph = await this.loadGraph();

    for (const deletion of deletions) {
      const entity = graph.entities.find(
        (item) => item.name === deletion.entityName
      );
      if (entity) {
        entity.observations = entity.observations.filter(
          (content) => !deletion.observations.includes(content)
        );
      }
    }

    await this.saveGraph(graph);
  }

  async deleteRelations(relations: Relation[]): Promise<void> {
    const graph = await this.loadGraph();
    graph.relations = graph.relations.filter(
      (relation) =>
        !relations.some(
          (candidate) =>
            relation.from === candidate.from &&
            relation.to === candidate.to &&
            relation.relationType === candidate.relationType
        )
    );
    await this.saveGraph(graph);
  }

  async readGraph(): Promise<KnowledgeGraph> {
    return this.loadGraph();
  }

  async searchNodes(query: string): Promise<KnowledgeGraph> {
    const graph = await this.loadGraph();
    const normalizedQuery = query.toLowerCase();

    const entities = graph.entities.filter((entity) => {
      if (entity.name.toLowerCase().includes(normalizedQuery)) return true;
      if (entity.entityType.toLowerCase().includes(normalizedQuery))
        return true;
      return entity.observations.some((observation) =>
        observation.toLowerCase().includes(normalizedQuery)
      );
    });

    const entityNames = new Set(entities.map((entity) => entity.name));
    const relations = graph.relations.filter(
      (relation) =>
        entityNames.has(relation.from) && entityNames.has(relation.to)
    );

    return { entities, relations };
  }

  async openNodes(names: string[]): Promise<KnowledgeGraph> {
    const graph = await this.loadGraph();
    const entityNames = new Set(names);

    const entities = graph.entities.filter((entity) =>
      entityNames.has(entity.name)
    );
    const relations = graph.relations.filter(
      (relation) =>
        entityNames.has(relation.from) && entityNames.has(relation.to)
    );

    return { entities, relations };
  }

  async appendSnapshot(): Promise<void> {
    const graph = await this.loadGraph();
    let timestamp: string;
    if (this.getTimestamp) {
      timestamp =
        typeof this.getTimestamp === "function"
          ? await this.getTimestamp()
          : this.getTimestamp;
    } else {
      timestamp = new Date().toISOString();
    }
    const payload: any = {
      type: "snapshot",
      timestamp,
      summary: {
        entityCount: graph.entities.length,
        relationCount: graph.relations.length,
      },
    };
    if (this.ttlSeconds) {
      payload.ttlSeconds = this.ttlSeconds;
      payload.expiresAt = new Date(
        Date.parse(timestamp) + this.ttlSeconds * 1000
      ).toISOString();
    }
    await appendFile(this.memoryFilePath, `${JSON.stringify(payload)}\n`);
  }
}
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
