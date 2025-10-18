#!/usr/bin/env node
// Validate ignore config: scan workspace, parse all ignore files, flag missed files
const fs = require("fs");
const path = require("path");
const ignore = require("ignore");

const IGNORE_FILES = [".gitignore", ".eslintignore", ".vercelignore"];
const ROOT = process.cwd();

function readIgnoreFile(file) {
  try {
    return fs.readFileSync(path.join(ROOT, file), "utf8");
  } catch {
    return "";
  }
}

function getAllFiles(dir, arr = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      if (entry === ".git") continue;
      getAllFiles(full, arr);
    } else {
      arr.push(path.relative(ROOT, full));
    }
  }
  return arr;
}

function main() {
  const allFiles = getAllFiles(ROOT);
  let flagged = [];
  for (const ignoreFile of IGNORE_FILES) {
    const ig = ignore().add(readIgnoreFile(ignoreFile));
    const missed = allFiles.filter((f) => ig.ignores(f) && fs.existsSync(f));
    flagged = flagged.concat(missed.map((f) => ({ file: f, ignoreFile })));
  }
  if (flagged.length) {
    console.log("Unwanted files detected by ignore config:");
    flagged.forEach(({ file, ignoreFile }) => {
      console.log(`  ${file} (ignored by ${ignoreFile})`);
    });
    process.exit(1);
  } else {
    console.log("Ignore config validated: no unwanted files detected.");
  }
}

main();
