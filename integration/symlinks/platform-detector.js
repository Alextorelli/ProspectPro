// Platform detector for integration-aware wiring
const fs = require("fs");
const path = require("path");

const symlinks = ["supabase"];
symlinks.forEach((link) => {
  const linkPath = path.resolve(process.cwd(), link);
  if (!fs.existsSync(linkPath) || !fs.lstatSync(linkPath).isSymbolicLink()) {
    console.error(`Missing symlink: ${link}`);
    process.exit(1);
  }
  const target = fs.readlinkSync(linkPath);
  if (!fs.existsSync(path.resolve(process.cwd(), target))) {
    console.error(`Symlink ${link} points to missing target: ${target}`);
    process.exit(1);
  }
  console.log(`Symlink ${link} -> ${target} [OK]`);
});
