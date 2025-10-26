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
export declare function resolveMemoryFilePath(options?: MemoryToolOptions): Promise<string>;
export declare class KnowledgeGraphManager {
    private readonly memoryFilePath;
    constructor(memoryFilePath: string);
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
export declare function buildToolList(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            entities: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        name: {
                            type: string;
                        };
                        entityType: {
                            type: string;
                        };
                        observations: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                    };
                    required: string[];
                    additionalProperties: boolean;
                };
            };
            relations?: undefined;
            observations?: undefined;
            entityNames?: undefined;
            deletions?: undefined;
            query?: undefined;
            names?: undefined;
        };
        required: string[];
        additionalProperties: boolean;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            relations: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        from: {
                            type: string;
                        };
                        to: {
                            type: string;
                        };
                        relationType: {
                            type: string;
                        };
                    };
                    required: string[];
                    additionalProperties: boolean;
                };
            };
            entities?: undefined;
            observations?: undefined;
            entityNames?: undefined;
            deletions?: undefined;
            query?: undefined;
            names?: undefined;
        };
        required: string[];
        additionalProperties: boolean;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            observations: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        entityName: {
                            type: string;
                        };
                        contents: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                    };
                    required: string[];
                    additionalProperties: boolean;
                };
            };
            entities?: undefined;
            relations?: undefined;
            entityNames?: undefined;
            deletions?: undefined;
            query?: undefined;
            names?: undefined;
        };
        required: string[];
        additionalProperties: boolean;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            entityNames: {
                type: string;
                items: {
                    type: string;
                };
            };
            entities?: undefined;
            relations?: undefined;
            observations?: undefined;
            deletions?: undefined;
            query?: undefined;
            names?: undefined;
        };
        required: string[];
        additionalProperties: boolean;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            deletions: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        entityName: {
                            type: string;
                        };
                        observations: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                    };
                    required: string[];
                    additionalProperties: boolean;
                };
            };
            entities?: undefined;
            relations?: undefined;
            observations?: undefined;
            entityNames?: undefined;
            query?: undefined;
            names?: undefined;
        };
        required: string[];
        additionalProperties: boolean;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            entities?: undefined;
            relations?: undefined;
            observations?: undefined;
            entityNames?: undefined;
            deletions?: undefined;
            query?: undefined;
            names?: undefined;
        };
        additionalProperties: boolean;
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
            };
            entities?: undefined;
            relations?: undefined;
            observations?: undefined;
            entityNames?: undefined;
            deletions?: undefined;
            names?: undefined;
        };
        required: string[];
        additionalProperties: boolean;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            names: {
                type: string;
                items: {
                    type: string;
                };
            };
            entities?: undefined;
            relations?: undefined;
            observations?: undefined;
            entityNames?: undefined;
            deletions?: undefined;
            query?: undefined;
        };
        required: string[];
        additionalProperties: boolean;
    };
})[];
export declare function handleToolCall(manager: KnowledgeGraphManager, toolName: string, args: Record<string, unknown> | undefined): Promise<KnowledgeGraph | Entity[] | Relation[] | {
    entityName: string;
    addedObservations: string[];
}[] | {
    status: string;
}>;
export declare function writeSnapshot(manager: KnowledgeGraphManager): Promise<void>;
export declare function initialiseKnowledgeGraph(options?: MemoryToolOptions): Promise<{
    readonly manager: KnowledgeGraphManager;
    readonly memoryFilePath: string;
}>;
//# sourceMappingURL=lib.d.ts.map