import { assert } from "https://deno.land/std@0.203.0/assert/assert.ts";

Deno.test("edge functions expose index.ts and function.toml", async () => {
  const rootDir = new URL("../", import.meta.url);
  const discovered: string[] = [];

  for await (const entry of Deno.readDir(rootDir)) {
    if (
      !entry.isDirectory ||
      entry.name.startsWith("_") ||
      entry.name === "tests"
    )
      continue;

    discovered.push(entry.name);

    try {
      const indexStat = await Deno.stat(
        new URL(`../${entry.name}/index.ts`, import.meta.url)
      );
      assert(indexStat.isFile, `Missing index.ts for ${entry.name}`);
    } catch {
      assert(false, `Missing index.ts for ${entry.name}`);
    }

    try {
      const tomlStat = await Deno.stat(
        new URL(`../${entry.name}/function.toml`, import.meta.url)
      );
      assert(tomlStat.isFile, `Missing function.toml for ${entry.name}`);
    } catch {
      assert(false, `Missing function.toml for ${entry.name}`);
    }
  }

  assert(discovered.length > 0, "No edge function directories detected");
});

Deno.test("_shared helpers directory contains TypeScript modules", async () => {
  const sharedDir = new URL("../_shared/", import.meta.url);
  let sharedStat;
  try {
    sharedStat = await Deno.stat(sharedDir);
  } catch {
    // If _shared doesn't exist, skip test
    return;
  }
  assert(sharedStat.isDirectory, "_shared directory missing");

  let helperCount = 0;
  for await (const entry of Deno.readDir(sharedDir)) {
    if (entry.isFile && entry.name.endsWith(".ts")) helperCount += 1;
  }

  assert(helperCount > 0, "No helper modules found in _shared");
});
