# Settings Staging Log (Relocated)

## 2025-10-26: Ollama Automation

- Added `dev-tools/scripts/automation/start-ollama.sh` as a lightweight runner for Ollama, supporting model pulls and logging.
- Added VS Code task `Ollama: Start Service` to `.vscode/tasks.json` for one-click launch and model management.
- Logs are captured in `dev-tools/workspace/context/session_store/logs/ollama.log`.
- Follows workspace policy for non-systemd service automation and staging of `.vscode/` changes.

> This log now lives at `docs/mmd-shared/config/settings-staging.md`. Update that file for any new `.vscode/` or `.github/` proposals.
