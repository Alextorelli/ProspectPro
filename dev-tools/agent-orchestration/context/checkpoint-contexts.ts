import { ContextManager } from "./context-manager.ts";

async function main(): Promise<void> {
  const manager = new ContextManager();
  const agents = [
    "system-architect",
    "observability",
    "development-workflow",
    "production-ops",
  ];

  const results = await Promise.allSettled(
    agents.map((id) => manager.checkpoint(id))
  );

  let hasFailure = false;
  results.forEach((result, index) => {
    const agentId = agents[index];
    if (result.status === "fulfilled") {
      console.log(`${agentId}: checkpointed`);
    } else {
      hasFailure = true;
      console.error(`${agentId}: failed`);
      console.error(result.reason);
    }
  });

  if (hasFailure) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Checkpoint command failed:");
  console.error(error);
  process.exitCode = 1;
});
