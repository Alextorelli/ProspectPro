// api/github-webhook.js
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get the signature from GitHub
  const signature = req.headers["x-hub-signature-256"];
  const event = req.headers["x-github-event"];

  // Your webhook secret (store in Vercel environment variables)
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  // Verify the signature
  const body = JSON.stringify(req.body);
  const hash = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const expectedSignature = `sha256=${hash}`;

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  // Handle push events
  if (event === "push") {
    const { commits, ref } = req.body;

    // Only process pushes to main branch
    if (ref !== "refs/heads/main") {
      return res.status(200).json({ message: "Ignored: not main branch" });
    }

    // Get changed files
    const changedFiles = new Set();
    commits.forEach((commit) => {
      commit.added?.forEach((file) => changedFiles.add(file));
      commit.modified?.forEach((file) => changedFiles.add(file));
      commit.removed?.forEach((file) => changedFiles.add(file));
    });

    // Determine which sections need updates
    const sectionsToUpdate = [];
    changedFiles.forEach((file) => {
      if (file.includes(".vscode/tasks.json")) sectionsToUpdate.push("tasks");
      if (file.includes(".vscode/keybindings.json"))
        sectionsToUpdate.push("shortcuts");
      if (file.includes(".vscode/settings.json"))
        sectionsToUpdate.push("settings");
      if (file.includes("package.json")) sectionsToUpdate.push("scripts");
      if (file.includes("CODEBASE_INDEX.md")) sectionsToUpdate.push("codebase");
      if (file.includes("SYSTEM_REFERENCE.md")) sectionsToUpdate.push("system");
      if (file.includes("DOCUMENTATION_INDEX.md"))
        sectionsToUpdate.push("docs");
    });

    console.log("Files changed:", Array.from(changedFiles));
    console.log("Sections to update:", sectionsToUpdate);

    // Here you would normally notify your Comet page
    // For now, just log the event

    return res.status(200).json({
      message: "Webhook processed",
      changedFiles: Array.from(changedFiles),
      sectionsToUpdate: sectionsToUpdate,
    });
  }

  return res.status(200).json({ message: "Event received but not processed" });
}
