# ProspectPro

## Prerequisites

- Node.js 18+
- Vercel CLI (`npm install -g vercel`)
- Supabase CLI: [Install using the official script or binary](https://github.com/supabase/cli#install-the-cli)
  - Example (Linux):
    ```bash
    curl -sL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
    sudo mv supabase /usr/local/bin/
    ```
- GitHub CLI: [Install using the official instructions](https://cli.github.com/manual/installation)
  - Example (Debian/Ubuntu):
    ```bash
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | \
      sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
    sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | \
      sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
    sudo apt update
    sudo apt install gh -y
    ```
