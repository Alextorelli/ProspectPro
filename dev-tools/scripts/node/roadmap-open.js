#!/usr/bin/env node
import { spawn } from "node:child_process";
import process from "node:process";

const PROJECT_URL = "https://github.com/users/Alextorelli/projects/5";

function openWithCommand(command, args) {
  const child = spawn(command, args, { stdio: "ignore", detached: true });
  child.on("error", () => {
    console.log(PROJECT_URL);
  });
  child.unref();
}

function openProject() {
  const explicit = process.env.BROWSER;
  if (explicit) {
    try {
      openWithCommand(explicit, [PROJECT_URL]);
      console.log(`Opened Project 5 dashboard with ${explicit}`);
      return;
    } catch (error) {
      console.warn(`Failed to launch with ${explicit}:`, error);
    }
  }

  const platform = process.platform;
  if (platform === "win32") {
    openWithCommand("cmd", ["/c", "start", '""', PROJECT_URL]);
  } else if (platform === "darwin") {
    openWithCommand("open", [PROJECT_URL]);
  } else {
    openWithCommand("xdg-open", [PROJECT_URL]);
  }
  console.log(`Opened Project 5 dashboard: ${PROJECT_URL}`);
}

try {
  openProject();
} catch (error) {
  console.error(
    "Unable to launch browser automatically. Open the URL manually:"
  );
  console.log(PROJECT_URL);
  console.error(error);
  process.exitCode = 1;
}
