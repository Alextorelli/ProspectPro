# ProspectPro v3.1 - Cloud-Native Lead Generation Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/Alextorelli/ProspectPro)
[![Deployment](https://img.shields.io/badge/deployment-cloud--native-blue)](https://github.com/Alextorelli/ProspectPro)
[![Quality Score](https://img.shields.io/badge/quality--score-v3.0-success)](https://github.com/Alextorelli/ProspectPro)

ProspectPro is a cloud-native lead generation platform that leverages Google Cloud and Supabase for enterprise-grade business discovery and validation.

## 🏗️ **Cloud-Native Architecture**

### **Platform Specialization**
- **GitHub**: Code repository and documentation
- **Google Cloud Build + Cloud Run**: Container builds and serverless hosting
- **Supabase**: Database, real-time features, secrets vault, edge functions

### **Deployment Pipeline**
```
Git Push → Cloud Build Trigger → Container Build → Cloud Run Deploy
              ↓
    Supabase Vault (secrets) → Environment Variables
              ↓
    Database Triggers → Webhook Endpoints → Real-time Processing
```

## 🚀 **Key Features**

### **Enhanced Quality Scoring v3.0**
- **4-stage validation pipeline**: Discovery → Enrichment → Validation → Export
- **35-45% qualification rates** with cost-efficient processing
- **Dynamic threshold adjustment** and real-time feedback

### **Production Webhook Infrastructure**
- **`/api/webhooks/campaign-lifecycle`** - Real-time campaign monitoring
- **`/api/webhooks/cost-alert`** - Budget protection and cost monitoring  
- **`/api/webhooks/lead-enrichment`** - Automated lead processing pipeline

### **API Integration Stack**
- **Google Places API**: Business discovery with rate limiting
- **Hunter.io**: Email discovery and validation
- **NeverBounce**: Email verification
- **Foursquare**: Additional business data enrichment
  brew install supabase/tap/supabase-beta
  brew link --overwrite supabase-beta
  ```
  
  To upgrade:

  ```sh
  brew upgrade supabase
  ```
</details>

<details>
  <summary><b>Windows</b></summary>

  Available via [Scoop](https://scoop.sh). To install:

  ```powershell
  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
  scoop install supabase
  ```

  To upgrade:

  ```powershell
  scoop update supabase
  ```
</details>

<details>
  <summary><b>Linux</b></summary>

  Available via [Homebrew](https://brew.sh) and Linux packages.

  #### via Homebrew

  To install:

  ```sh
  brew install supabase/tap/supabase
  ```

  To upgrade:

  ```sh
  brew upgrade supabase
  ```

  #### via Linux packages

  Linux packages are provided in [Releases](https://github.com/supabase/cli/releases). To install, download the `.apk`/`.deb`/`.rpm`/`.pkg.tar.zst` file depending on your package manager and run the respective commands.

  ```sh
  sudo apk add --allow-untrusted <...>.apk
  ```

  ```sh
  sudo dpkg -i <...>.deb
  ```

  ```sh
  sudo rpm -i <...>.rpm
  ```

  ```sh
  sudo pacman -U <...>.pkg.tar.zst
  ```
</details>

<details>
  <summary><b>Other Platforms</b></summary>

  You can also install the CLI via [go modules](https://go.dev/ref/mod#go-install) without the help of package managers.

  ```sh
  go install github.com/supabase/cli@latest
  ```

  Add a symlink to the binary in `$PATH` for easier access:

  ```sh
  ln -s "$(go env GOPATH)/cli" /usr/bin/supabase
  ```

  This works on other non-standard Linux distros.
</details>

<details>
  <summary><b>Community Maintained Packages</b></summary>

  Available via [pkgx](https://pkgx.sh/). Package script [here](https://github.com/pkgxdev/pantry/blob/main/projects/supabase.com/cli/package.yml).
  To install in your working directory:

  ```bash
  pkgx install supabase
  ```

  Available via [Nixpkgs](https://nixos.org/). Package script [here](https://github.com/NixOS/nixpkgs/blob/master/pkgs/development/tools/supabase-cli/default.nix).
</details>

### Run the CLI

```bash
supabase bootstrap
```

Or using npx:

```bash
npx supabase bootstrap
```

The bootstrap command will guide you through the process of setting up a Supabase project using one of the [starter](https://github.com/supabase-community/supabase-samples/blob/main/samples.json) templates.

## Docs

Command & config reference can be found [here](https://supabase.com/docs/reference/cli/about).

## Breaking changes

We follow semantic versioning for changes that directly impact CLI commands, flags, and configurations.

However, due to dependencies on other service images, we cannot guarantee that schema migrations, seed.sql, and generated types will always work for the same CLI major version. If you need such guarantees, we encourage you to pin a specific version of CLI in package.json.

## Developing

To run from source:

```sh
# Go >= 1.22
go run . help
```
