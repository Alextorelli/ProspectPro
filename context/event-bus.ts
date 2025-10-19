import { EventEmitter } from "events";

export const eventBus = new EventEmitter();

// Example usage:
// eventBus.on('agentEvent', (payload) => { ... });
// eventBus.emit('agentEvent', { ... });
