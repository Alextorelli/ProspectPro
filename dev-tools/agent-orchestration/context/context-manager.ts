import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
 
// Context routing follows Option A taxonomy: @ux, @platform, @devops, @secops, @integrations
// All context snapshots and outputs are routed to reports/context/<tag>/

type EnvironmentName = "production" | "staging" | "development";

export interface ScratchpadNote {
  timestamp: string;
  content: string;
  tags?: string[];
}

export interface Scratchpad {
  currentTask: string | null;
  notes: ScratchpadNote[];
  lastUpdated: string;
  summary: string | null;
}

export interface LongTermMemoryItem {
  id: string;
  topic: string;
  payload: Record<string, unknown>;
  createdAt: string;
  lastAccessed: string;
  environment: EnvironmentName | null;
  tags?: string[];
  derivedFrom?: string[] | null;
}

export interface AgentMetadata {
  environment: EnvironmentName;
  version: string;
  lastCheckpoint: string;
  checksum: string | null;
}

export interface AgentContext {
  agentId: string;
  scratchpad: Scratchpad;
  longTermMemory: LongTermMemoryItem[];
  metadata: AgentMetadata;
}

interface SelectFilters {
  environment?: EnvironmentName;
  sinceMinutes?: number;
  keywords?: string[];
  topics?: string[];
  limit?: number;
  keywordMatch?: "any" | "all";
}

export interface SelectInput {
  agentId: string;
  filters?: SelectFilters;
}

export interface SelectResult {
  agentId: string;
  scratchpad: Pick<Scratchpad, "currentTask" | "summary"> & {
    notes: ScratchpadNote[];
  };
  longTermMemory: LongTermMemoryItem[];
  metadata: AgentMetadata;

  // Utility to get output directory for Option A participant tag
  function getContextOutputDir(tag: OptionATag): string {
    return path.join("reports", "context", tag);
  }

  // Export context snapshot to Option A output directory
  export async function exportContextSnapshot(agentId: string, tag: OptionATag, snapshot: object) {
    const outputDir = getContextOutputDir(tag);
    await fs.mkdir(outputDir, { recursive: true });
    const filePath = path.join(outputDir, `snapshot-${agentId}-${Date.now()}.json`);
    await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), "utf8");
    return filePath;
  }

type ScratchpadNoteInput =
  | string
  | (Partial<ScratchpadNote> & { content: string; timestamp?: string });

interface UpdateScratchpadInput {
  agentId: string;
  data: {
    currentTask?: string | null;
    notes?: ScratchpadNoteInput | ScratchpadNoteInput[];
    summary?: string | null;
  };
  tags?: string[];
  append?: boolean;
  environment?: EnvironmentName;
}

interface CompressOptions {
  agentId: string;
  maxItems?: number;
  promoteSummary?: boolean;
}

export interface CompressResult {
  compressed: boolean;
  dropped: number;
  retained: number;
  summary?: string;
}

type MemoryPayload = Omit<
  LongTermMemoryItem,
  "id" | "createdAt" | "lastAccessed"
> & {
  id?: string;
  createdAt?: string;
  lastAccessed?: string;
};

interface UpsertMemoryInput {
  agentId: string;
  memory: MemoryPayload;
  updateLastAccessed?: boolean;
}

interface ContextManagerOptions {
  storeDir?: string;
  schemaVersion?: string;
  defaultEnvironment?: EnvironmentName;
  scratchpadLimit?: number;
  dateProvider?: () => Date;
}

export interface EnvironmentStateEntry {
  agentId: string;
  from: EnvironmentName;
  to: EnvironmentName;
  reason?: string;
  timestamp: string;
}

interface EnvironmentState {
  global: EnvironmentName;
  agents: Record<string, EnvironmentName>;
  history: EnvironmentStateEntry[];
}

export interface EnvironmentContext {
  name: EnvironmentName;
  description?: string;
  supabase: {
    projectRef: string;
    apiUrl: string;
    anonKey: string | null;
    serviceRoleKey: string | null;
  };
  vercel: {
    deploymentUrl: string;
    projectName: string | null;
  };
  apiRateLimits?: Record<
    string,
    { monthlyLimit?: number; alertThreshold?: number; unit?: string }
  >;
  featureFlags?: Record<string, boolean>;
  monitoring?: {
    otelEndpoint?: string;
    jaegerUrl?: string;
    logDashboard?: string;
  };
  permissions: {
    writeOperations: boolean;
    canDeploy: boolean;
    canFetchLogs: boolean;
    canRunTests: boolean;
    requiresApproval?: boolean;
  };
  constraints?: {
    maxScratchpadEntries?: number;
    maxTaskConcurrency?: number;
  };
}

interface SwitchEnvironmentInput {
  agentId: string;
  target: EnvironmentName;
  reason?: string;
  requireApproval?: boolean;
  checkpoint?: boolean;
}

interface TaskLedgerEvent {
  timestamp: string;
  description: string;
  actor?: string | null;
  metadata?: Record<string, unknown>;
}

export interface TaskLedgerEntry {
  id: string;
  type: "feature" | "incident" | "migration" | "maintenance";
  status: "in_progress" | "blocked" | "completed" | "snoozed";
  owner: string;
  collaborators?: string[];
  environment?: EnvironmentName;
  createdAt: string;
  updatedAt: string;
  contextSnapshot?: string | null;
  mcpTools?: string[];
  events?: TaskLedgerEvent[];
  summary?: string | null;
}

interface TaskLedgerOptions {
  storeDir?: string;
  dateProvider?: () => Date;
  filename?: string;
}

export class FileIntegrityError extends Error {}

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const defaultStoreDir = path.join(moduleDir, "store");

const environmentStateFile = "environment-state.json";
const defaultLedgerFile = "task-ledger.json";

const keywordMatchers: Readonly<
  Record<"any" | "all", (text: string, keywords: string[]) => boolean>
> = {
  any: (text, keywords) => keywords.some((keyword) => text.includes(keyword)),
  all: (text, keywords) => keywords.every((keyword) => text.includes(keyword)),
};

const sortByTimestampAsc = <T extends { timestamp: string }>(values: T[]) => {
  return values.slice().sort((a, b) => {
    const tsA = Date.parse(a.timestamp);
    const tsB = Date.parse(b.timestamp);
    return tsA - tsB;
  });
};

class TaskLedger {
  private readonly filePath: string;
  private readonly dateProvider: () => Date;

  constructor(options?: TaskLedgerOptions) {
    const baseDir = options?.storeDir ?? defaultStoreDir;
    this.filePath = path.join(
      baseDir,
      "ledgers",
      options?.filename ?? defaultLedgerFile
    );
    this.dateProvider = options?.dateProvider ?? (() => new Date());
  }

  async list(): Promise<TaskLedgerEntry[]> {
    return this.readLedger();
  }

  async upsert(entry: TaskLedgerEntry): Promise<TaskLedgerEntry> {
    const ledger = await this.readLedger();
    const index = ledger.findIndex((item) => item.id === entry.id);
    if (index >= 0) {
      ledger[index] = entry;
    } else {
      ledger.push(entry);
    }
    await this.writeLedger(ledger);
    return entry;
  }

  async addEvent(entryId: string, event: TaskLedgerEvent): Promise<void> {
    const ledger = await this.readLedger();
    const entry = ledger.find((item) => item.id === entryId);
    if (!entry) {
      throw new Error(`Ledger entry ${entryId} not found`);
    }
    const events = entry.events ?? [];
    events.push(event);
    entry.events = sortByTimestampAsc(events);
    entry.updatedAt = this.nowISO();
    await this.writeLedger(ledger);
  }

  async recordEnvironmentTransition(input: {
    agentId: string;
    from: EnvironmentName;
    to: EnvironmentName;
    reason?: string;
  }): Promise<void> {
    const ledger = await this.readLedger();
    const id = `environment-${input.agentId}`;
    const now = this.nowISO();
    let entry = ledger.find((item) => item.id === id);
    if (!entry) {
      entry = {
        id,
        type: "maintenance",
        status: "in_progress",
        owner: input.agentId,
        environment: input.to,
        createdAt: now,
        updatedAt: now,
        contextSnapshot: null,
        mcpTools: [],
        events: [],
        summary: null,
      };
      ledger.push(entry);
    }
    entry.environment = input.to;
    entry.updatedAt = now;
    const description =
      input.reason && input.reason.trim().length > 0
        ? `Environment switch: ${input.from} -> ${input.to} (${input.reason})`
        : `Environment switch: ${input.from} -> ${input.to}`;
    const events = entry.events ?? [];
    events.push({
      timestamp: now,
      description,
      actor: input.agentId,
      metadata: {
        from: input.from,
        to: input.to,
        reason: input.reason ?? null,
      },
    });
    entry.events = sortByTimestampAsc(events);
    await this.writeLedger(ledger);
  }

  private nowISO(): string {
    return this.dateProvider().toISOString();
  }

  private async readLedger(): Promise<TaskLedgerEntry[]> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as TaskLedgerEntry[];
      return parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        await fs.writeFile(this.filePath, "[]", "utf8");
        return [];
      }
      throw error;
    }
  }

  private async writeLedger(entries: TaskLedgerEntry[]): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const data = JSON.stringify(entries, null, 2);
    await fs.writeFile(this.filePath, data, "utf8");
  }
}

export class ContextManager {
  private readonly storeDir: string;
  private readonly schemaVersion: string;
  private readonly defaultEnvironment: EnvironmentName;
  private readonly scratchpadLimit: number;
  private readonly dateProvider: () => Date;

  constructor(options?: ContextManagerOptions) {
    this.storeDir = options?.storeDir ?? defaultStoreDir;
    this.schemaVersion = options?.schemaVersion ?? "1.0.0";
    this.defaultEnvironment = options?.defaultEnvironment ?? "development";
    this.scratchpadLimit = options?.scratchpadLimit ?? 80;
    this.dateProvider = options?.dateProvider ?? (() => new Date());
  }

  async listAgents(): Promise<string[]> {
    const dir = path.join(this.storeDir, "agents");
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async restore(agentId: string): Promise<AgentContext> {
    return this.loadAgentContext(agentId);
  }

  async checkpoint(
    agentId: string,
    context?: AgentContext
  ): Promise<AgentContext> {
    const data = context ?? (await this.loadAgentContext(agentId));
    data.metadata.lastCheckpoint = this.nowISO();
    return this.writeAgentContext(data);
  }

  async updateScratchpad(input: UpdateScratchpadInput): Promise<AgentContext> {
    const context = await this.loadAgentContext(input.agentId);
    const scratchpad = context.scratchpad;
    const now = this.nowISO();

    if (input.data.currentTask !== undefined) {
      scratchpad.currentTask = input.data.currentTask;
    }

    if (input.data.summary !== undefined) {
      scratchpad.summary = input.data.summary;
    }

    if (input.data.notes !== undefined) {
      const incoming = Array.isArray(input.data.notes)
        ? input.data.notes
        : [input.data.notes];
      const notes = incoming.map((note) =>
        this.normalizeNote(note, input.tags ?? [])
      );
      if (input.append === false) {
        scratchpad.notes = sortByTimestampAsc(notes);
      } else {
        scratchpad.notes = sortByTimestampAsc([...scratchpad.notes, ...notes]);
      }
    }

    scratchpad.lastUpdated = now;

    if (input.environment) {
      context.metadata.environment = input.environment;
    }

    return this.checkpoint(input.agentId, context);
  }

  async select(input: SelectInput): Promise<SelectResult> {
    const context = await this.loadAgentContext(input.agentId);
    const filters = input.filters ?? {};
    const notes = this.filterNotes(context.scratchpad.notes, filters);
    const memories = this.filterMemories(context.longTermMemory, filters);
    const persisted = memories.mutated
      ? await this.checkpoint(input.agentId, context)
      : context;

    return {
      agentId: context.agentId,
      scratchpad: {
        currentTask: persisted.scratchpad.currentTask,
        summary: persisted.scratchpad.summary,
        notes,
      },
      longTermMemory: memories.items,
      metadata: persisted.metadata,
    };
  }

  async compress(options: CompressOptions): Promise<CompressResult> {
    const limit = options.maxItems ?? this.scratchpadLimit;
    const context = await this.loadAgentContext(options.agentId);
    const notes = context.scratchpad.notes;

    if (notes.length <= limit) {
      return {
        compressed: false,
        dropped: 0,
        retained: notes.length,
        summary: context.scratchpad.summary ?? undefined,
      };
    }

    const retained = notes.slice(notes.length - limit);
    const dropped = notes.slice(0, notes.length - limit);
    const summary = this.buildSummary(dropped);
    context.scratchpad.notes = retained;
    if (options.promoteSummary !== false) {
      context.scratchpad.summary = summary;
    }
    context.scratchpad.lastUpdated = this.nowISO();
    await this.checkpoint(options.agentId, context);

    return {
      compressed: true,
      dropped: dropped.length,
      retained: retained.length,
      summary,
    };
  }

  async upsertMemory(input: UpsertMemoryInput): Promise<LongTermMemoryItem> {
    const context = await this.loadAgentContext(input.agentId);
    const now = this.nowISO();
    const payload = input.memory;
    const id = payload.id ?? randomUUID();
    const createdAt = payload.createdAt ?? now;
    const lastAccessed =
      input.updateLastAccessed === false ? payload.lastAccessed ?? now : now;
    const environment =
      payload.environment ?? context.metadata.environment ?? null;

    const updated: LongTermMemoryItem = {
      id,
      topic: payload.topic,
      payload: payload.payload,
      createdAt,
      lastAccessed,
      environment,
      tags: payload.tags ? [...payload.tags] : undefined,
      derivedFrom: payload.derivedFrom ? [...payload.derivedFrom] : undefined,
    };

    const index = context.longTermMemory.findIndex((item) => item.id === id);
    if (index >= 0) {
      context.longTermMemory[index] = updated;
    } else {
      context.longTermMemory.push(updated);
    }

    context.longTermMemory = context.longTermMemory.sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
    );

    await this.checkpoint(input.agentId, context);
    return updated;
  }

  async removeMemory(agentId: string, memoryId: string): Promise<boolean> {
    const context = await this.loadAgentContext(agentId);
    const initial = context.longTermMemory.length;
    context.longTermMemory = context.longTermMemory.filter(
      (item) => item.id !== memoryId
    );
    if (context.longTermMemory.length === initial) {
      return false;
    }
    await this.checkpoint(agentId, context);
    return true;
  }

  async setAgentEnvironment(
    agentId: string,
    environment: EnvironmentName
  ): Promise<AgentContext> {
    const context = await this.loadAgentContext(agentId);
    context.metadata.environment = environment;
    return this.checkpoint(agentId, context);
  }

  private filterNotes(
    notes: ScratchpadNote[],
    filters: SelectFilters
  ): ScratchpadNote[] {
    const limit = filters.limit ?? Infinity;
    let filtered = notes.slice().reverse();

    if (filters.sinceMinutes !== undefined) {
      const threshold =
        this.dateProvider().getTime() - filters.sinceMinutes * 60_000;
      filtered = filtered.filter(
        (note) => Date.parse(note.timestamp) >= threshold
      );
    }

    if (filters.keywords && filters.keywords.length > 0) {
      const keywords = filters.keywords.map((keyword) => keyword.toLowerCase());
      const matcher = keywordMatchers[filters.keywordMatch ?? "any"];
      filtered = filtered.filter((note) =>
        matcher(note.content.toLowerCase(), keywords)
      );
    }

    return filtered.slice(0, limit).reverse();
  }

  private filterMemories(
    memories: LongTermMemoryItem[],
    filters: SelectFilters
  ): { items: LongTermMemoryItem[]; mutated: boolean; limitReached: boolean } {
    const limit = filters.limit ?? Infinity;
    let filtered = memories;

    if (filters.environment) {
      filtered = filtered.filter(
        (item) =>
          item.environment === filters.environment || item.environment === null
      );
    }

    if (filters.topics && filters.topics.length > 0) {
      const topics = filters.topics.map((topic) => topic.toLowerCase());
      filtered = filtered.filter((item) =>
        topics.includes(item.topic.toLowerCase())
      );
    }

    if (filters.keywords && filters.keywords.length > 0) {
      const matcher = keywordMatchers[filters.keywordMatch ?? "any"];
      const keywords = filters.keywords.map((keyword) => keyword.toLowerCase());
      filtered = filtered.filter((item) => {
        const haystack = JSON.stringify(item.payload).toLowerCase();
        return matcher(haystack, keywords);
      });
    }

    if (filters.sinceMinutes !== undefined) {
      const threshold =
        this.dateProvider().getTime() - filters.sinceMinutes * 60_000;
      filtered = filtered.filter(
        (item) => Date.parse(item.lastAccessed) >= threshold
      );
    }

    const sorted = filtered
      .slice()
      .sort((a, b) => Date.parse(b.lastAccessed) - Date.parse(a.lastAccessed));

    const selected = sorted.slice(0, limit);
    const mutated = selected.length > 0;
    const limitReached = sorted.length > selected.length;

    if (mutated) {
      const now = this.nowISO();
      selected.forEach((item) => {
        item.lastAccessed = now;
      });
    }

    return {
      items: selected.map((item) => ({ ...item })),
      mutated,
      limitReached,
    };
  }

  private buildSummary(notes: ScratchpadNote[]): string {
    if (notes.length === 0) {
      return "";
    }
    const start = notes[0]?.timestamp ?? "";
    const end = notes[notes.length - 1]?.timestamp ?? "";
    const highlights = notes
      .slice(-5)
      .map((note) => note.content.trim())
      .filter((content) => content.length > 0)
      .join(" | ");
    return `Compressed ${notes.length} notes (${start} to ${end}). Highlights: ${highlights}`.trim();
  }

  private normalizeNote(
    note: ScratchpadNoteInput,
    tags: string[]
  ): ScratchpadNote {
    if (typeof note === "string") {
      return {
        timestamp: this.nowISO(),
        content: note,
        tags: tags.length > 0 ? [...tags] : undefined,
      };
    }
    const mergedTags = new Set<string>();
    (note.tags ?? []).forEach((tag) => mergedTags.add(tag));
    tags.forEach((tag) => mergedTags.add(tag));
    return {
      timestamp: note.timestamp ?? this.nowISO(),
      content: note.content,
      tags: mergedTags.size > 0 ? Array.from(mergedTags) : undefined,
    };
  }

  private async loadAgentContext(agentId: string): Promise<AgentContext> {
    const file = this.agentFile(agentId);
    try {
      const raw = await fs.readFile(file, "utf8");
      const parsed = JSON.parse(raw) as AgentContext;
      this.verifyChecksum(parsed);
      return this.applyDefaults(parsed);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        const fresh = this.createDefaultContext(agentId);
        await this.writeAgentContext(fresh);
        return fresh;
      }
      throw error;
    }
  }

  private applyDefaults(context: AgentContext): AgentContext {
    const metadata: AgentMetadata = {
      environment: context.metadata.environment ?? this.defaultEnvironment,
      version: context.metadata.version ?? this.schemaVersion,
      lastCheckpoint: context.metadata.lastCheckpoint ?? this.nowISO(),
      checksum: context.metadata.checksum ?? null,
    };
    const scratchpad: Scratchpad = {
      currentTask: context.scratchpad.currentTask ?? null,
      notes: sortByTimestampAsc(context.scratchpad.notes ?? []),
      lastUpdated: context.scratchpad.lastUpdated ?? this.nowISO(),
      summary: context.scratchpad.summary ?? null,
    };
    const longTermMemory = (context.longTermMemory ?? []).map((item) => ({
      id: item.id,
      topic: item.topic,
      payload: item.payload,
      createdAt: item.createdAt ?? this.nowISO(),
      lastAccessed: item.lastAccessed ?? item.createdAt ?? this.nowISO(),
      environment: item.environment ?? metadata.environment ?? null,
      tags: item.tags ? [...item.tags] : undefined,
      derivedFrom: item.derivedFrom ? [...item.derivedFrom] : undefined,
    }));
    return {
      agentId: context.agentId,
      scratchpad,
      longTermMemory,
      metadata,
    };
  }

  private createDefaultContext(agentId: string): AgentContext {
    const now = this.nowISO();
    return {
      agentId,
      scratchpad: {
        currentTask: null,
        notes: [],
        lastUpdated: now,
        summary: null,
      },
      longTermMemory: [],
      metadata: {
        environment: this.defaultEnvironment,
        version: this.schemaVersion,
        lastCheckpoint: now,
        checksum: null,
      },
    };
  }

  private async writeAgentContext(
    context: AgentContext
  ): Promise<AgentContext> {
    await fs.mkdir(path.dirname(this.agentFile(context.agentId)), {
      recursive: true,
    });
    const payload = {
      ...context,
      metadata: {
        ...context.metadata,
        lastCheckpoint: context.metadata.lastCheckpoint ?? this.nowISO(),
      },
    };
    const checksum = this.computeChecksum(payload);
    payload.metadata.checksum = checksum;
    const data = JSON.stringify(payload, null, 2);
    await fs.writeFile(this.agentFile(context.agentId), data, "utf8");
    return payload;
  }

  private computeChecksum(context: AgentContext): string {
    const payload = {
      ...context,
      metadata: {
        ...context.metadata,
        checksum: null,
      },
    };
    const json = JSON.stringify(payload);
    return createHash("sha256").update(json).digest("hex");
  }

  private verifyChecksum(context: AgentContext): void {
    const expected = this.computeChecksum(context);
    if (!context.metadata.checksum) {
      throw new FileIntegrityError(
        `Missing checksum for agent context ${context.agentId}`
      );
    }
    if (context.metadata.checksum !== expected) {
      throw new FileIntegrityError(
        `Checksum mismatch for agent context ${context.agentId}`
      );
    }
  }

  private agentDir(agentId: string): string {
    return path.join(this.storeDir, "agents", agentId);
  }

  private agentFile(agentId: string): string {
    return path.join(this.agentDir(agentId), "context.json");
  }

  private nowISO(): string {
    return this.dateProvider().toISOString();
  }
}

export class EnvironmentContextManager {
  private readonly storeDir: string;
  private readonly statePath: string;
  private readonly ledger: TaskLedger;
  private readonly contextManager?: ContextManager;
  private readonly dateProvider: () => Date;

  constructor(options?: {
    storeDir?: string;
    stateFile?: string;
    ledger?: TaskLedger;
    contextManager?: ContextManager;
    dateProvider?: () => Date;
  }) {
    this.storeDir = options?.storeDir ?? defaultStoreDir;
    this.statePath = path.join(
      this.storeDir,
      "shared",
      options?.stateFile ?? environmentStateFile
    );
    this.ledger =
      options?.ledger ?? new TaskLedger({ storeDir: this.storeDir });
    this.contextManager = options?.contextManager;
    this.dateProvider = options?.dateProvider ?? (() => new Date());
  }

  async list(): Promise<EnvironmentContext[]> {
    const envDir = path.join(this.storeDir, "environments");
    try {
      const entries = await fs.readdir(envDir);
      const contexts: EnvironmentContext[] = [];
      for (const entry of entries) {
        if (!entry.endsWith(".json")) continue;
        const context = await this.readEnvironment(
          entry.replace(/\.json$/, "") as EnvironmentName
        );
        contexts.push(context);
      }
      return contexts.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async current(agentId?: string): Promise<EnvironmentContext> {
    const state = await this.readState();
    const name = agentId ? state.agents[agentId] ?? state.global : state.global;
    return this.readEnvironment(name);
  }

  async switchEnvironment(
    input: SwitchEnvironmentInput
  ): Promise<EnvironmentContext> {
    const environment = await this.readEnvironment(input.target);
    if (environment.permissions.requiresApproval && !input.requireApproval) {
      throw new Error(
        `Environment ${input.target} requires approval before switching`
      );
    }

    const state = await this.readState();
    const previous = state.agents[input.agentId] ?? state.global;

    if (input.checkpoint !== false && this.contextManager) {
      await this.contextManager.checkpoint(input.agentId);
    }

    state.agents[input.agentId] = environment.name;
    state.history.push({
      agentId: input.agentId,
      from: previous,
      to: environment.name,
      reason: input.reason,
      timestamp: this.nowISO(),
    });
    state.global = environment.name;
    await this.writeState(state);

    if (this.contextManager) {
      await this.contextManager.setAgentEnvironment(
        input.agentId,
        environment.name
      );
    }

    await this.ledger.recordEnvironmentTransition({
      agentId: input.agentId,
      from: previous,
      to: environment.name,
      reason: input.reason,
    });

    return environment;
  }

  async canPerform(
    action: "write" | "deploy" | "fetchLogs" | "runTests",
    environmentName?: EnvironmentName
  ): Promise<boolean> {
    const context = environmentName
      ? await this.readEnvironment(environmentName)
      : await this.current();
    switch (action) {
      case "write":
        return context.permissions.writeOperations;
      case "deploy":
        return context.permissions.canDeploy;
      case "fetchLogs":
        return context.permissions.canFetchLogs;
      case "runTests":
        return context.permissions.canRunTests;
      default:
        return false;
    }
  }

  async history(): Promise<EnvironmentStateEntry[]> {
    const state = await this.readState();
    return state.history
      .slice()
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  }

  private async readEnvironment(
    name: EnvironmentName
  ): Promise<EnvironmentContext> {
    const file = path.join(this.storeDir, "environments", `${name}.json`);
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as EnvironmentContext;
    return {
      name: parsed.name ?? name,
      description: parsed.description,
      supabase: {
        projectRef: parsed.supabase.projectRef,
        apiUrl: parsed.supabase.apiUrl,
        anonKey: parsed.supabase.anonKey ?? null,
        serviceRoleKey: parsed.supabase.serviceRoleKey ?? null,
      },
      vercel: {
        deploymentUrl: parsed.vercel.deploymentUrl,
        projectName: parsed.vercel.projectName ?? null,
      },
      apiRateLimits: parsed.apiRateLimits ?? undefined,
      featureFlags: parsed.featureFlags ?? undefined,
      monitoring: parsed.monitoring ?? undefined,
      permissions: parsed.permissions,
      constraints: parsed.constraints ?? undefined,
    };
  }

  private async readState(): Promise<EnvironmentState> {
    try {
      const raw = await fs.readFile(this.statePath, "utf8");
      const parsed = JSON.parse(raw) as EnvironmentState;
      return {
        global: parsed.global ?? "development",
        agents: parsed.agents ?? {},
        history: parsed.history ?? [],
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        const initial: EnvironmentState = {
          global: "development",
          agents: {},
          history: [],
        };
        await this.writeState(initial);
        return initial;
      }
      throw error;
    }
  }

  private async writeState(state: EnvironmentState): Promise<void> {
    await fs.mkdir(path.dirname(this.statePath), { recursive: true });
    const data = JSON.stringify(state, null, 2);
    await fs.writeFile(this.statePath, data, "utf8");
  }

  private nowISO(): string {
    return this.dateProvider().toISOString();
  }
}

export { TaskLedger };
