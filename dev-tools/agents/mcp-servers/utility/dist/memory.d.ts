import { Tool } from "@modelcontextprotocol/sdk/types.js";
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
}
export declare class KnowledgeGraphManager {
    private readonly memoryFilePath;
    constructor(memoryFilePath: string);
    get filePath(): string;
    private loadGraph;
    private saveGraph;
    private ensureEntityExists;
    createEntities(entities: Entity[]): Promise<Entity[]>;
    createRelations(relations: Relation[]): Promise<Relation[]>;
    addObservations(observations: {
        entityName: string;
        contents: string[];
    }[]): Promise<{
        entityName: string;
        addedObservations: string[];
    }[]>;
    deleteEntities(entityNames: string[]): Promise<void>;
    deleteObservations(deletions: {
        entityName: string;
        observations: string[];
    }[]): Promise<void>;
    deleteRelations(relations: Relation[]): Promise<void>;
    readGraph(): Promise<KnowledgeGraph>;
    searchNodes(query: string): Promise<KnowledgeGraph>;
    openNodes(names: string[]): Promise<KnowledgeGraph>;
    appendSnapshot(): Promise<void>;
}
export declare function initialiseKnowledgeGraph(options?: MemoryToolOptions): Promise<{
    manager: KnowledgeGraphManager;
    memoryFilePath: string;
}>;
export declare function buildMemoryToolList(): Tool[];
export declare function executeMemoryTool(manager: KnowledgeGraphManager, toolName: string, args: Record<string, unknown> | undefined): Promise<unknown>;
//# sourceMappingURL=memory.d.ts.map