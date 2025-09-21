# Supabase CLI

[![Coverage Status](https://coveralls.io/repos/github/supabase/cli/badge.svg?branch=main)](https://coveralls.io/github/supabase/cli?branch=main) [![Bitbucket Pipelines](https://img.shields.io/bitbucket/pipelines/supabase-cli/setup-cli/master?style=flat-square&label=Bitbucket%20Canary)](https://bitbucket.org/supabase-cli/setup-cli/pipelines) [![Gitlab Pipeline Status](https://img.shields.io/gitlab/pipeline-status/sweatybridge%2Fsetup-cli?label=Gitlab%20Canary)
](https://gitlab.com/sweatybridge/setup-cli/-/pipelines)

[Supabase](https://supabase.io) is an open source Firebase alternative. We're building the features of Firebase using enterprise-grade open source tools.

This repository contains all the functionality for Supabase CLI.

- [x] Running Supabase locally
- [x] Managing database migrations
- [x] Creating and deploying Supabase Functions
- [x] Generating types directly from your database schema
- [x] Making authenticated HTTP requests to [Management API](https://supabase.com/docs/reference/api/introduction)

## Getting started

### Install the CLI

Available via [NPM](https://www.npmjs.com) as dev dependency. To install:

```bash
npm i supabase --save-dev
```

To install the beta release channel:

```bash
npm i supabase@beta --save-dev
```

When installing with yarn 4, you need to disable experimental fetch with the following nodejs config.

```
NODE_OPTIONS=--no-experimental-fetch yarn add supabase
```

> **Note**
> For Bun versions below v1.0.17, you must add `supabase` as a [trusted dependency](https://bun.sh/guides/install/trusted) before running `bun add -D supabase`.

<details>
  <summary><b>macOS</b></summary>

Available via [Homebrew](https://brew.sh). To install:

```sh
brew install supabase/tap/supabase
```

To install the beta release channel:

```sh
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
ln -s "$(go env GOPATH)/bin/cli" /usr/bin/supabase
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

# ProspectPro - Enhanced Lead Discovery Platform

## 🚀 Latest Updates (v2.0)

### Enhanced CSV Export System

- **Multi-Query Campaigns**: Build comprehensive datasets across multiple searches
- **45+ Column CSV Export**: Complete business intelligence data with owner/company contact differentiation
- **Campaign Analytics**: Query-level analysis with cost efficiency and quality metrics
- **Testing Support**: Rich metadata for algorithm optimization and A/B testing

### Zero Fake Data Architecture

ProspectPro maintains **zero tolerance for fake business data** through:

- Real-time Google Places API integration
- Multi-source validation (Hunter.io, NeverBounce, State Registries)
- Sophisticated owner detection algorithms
- 80%+ email deliverability requirements

## Quick Start

### Installation

```bash
git clone https://github.com/yourusername/ProspectPro.git
cd ProspectPro
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Add your API keys:
# GOOGLE_PLACES_API_KEY=your_key
# HUNTER_IO_API_KEY=your_key
# NEVERBOUNCE_API_KEY=your_key
# SUPABASE_URL=your_url
# SUPABASE_SECRET_KEY=your_key
```

### Start Server

```bash
npm run dev  # Development with auto-reload
# or
npm start   # Production mode
```

## API Usage Examples

### Single Query Discovery

```javascript
const response = await fetch("http://localhost:3000/api/business/discover", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: "pizza restaurants",
    location: "Austin, TX",
    count: 20,
    budgetLimit: 5.0,
    qualityThreshold: 75,
    exportToCsv: true,
  }),
});

const result = await response.json();
console.log(`Found ${result.results.length} qualified leads`);
console.log(`CSV exported: ${result.csvExport.filename}`);
```

### Multi-Query Campaign

```javascript
// Start campaign
const campaign = await fetch(
  "http://localhost:3000/api/business/campaign/start",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campaignName: "Austin Food Scene Analysis",
      description: "Comprehensive restaurant market research",
    }),
  }
);

const { campaignId } = await campaign.json();

// Add multiple queries
const queries = [
  "pizza restaurants",
  "taco shops",
  "bbq restaurants",
  "food trucks",
];

for (const query of queries) {
  await fetch("http://localhost:3000/api/business/campaign/add-query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campaignId,
      query,
      location: "Austin, TX",
      count: 25,
    }),
  });
}

// Export comprehensive dataset
const exportResult = await fetch(
  "http://localhost:3000/api/business/campaign/export",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campaignId }),
  }
);

const exportData = await exportResult.json();
console.log(`Campaign CSV: ${exportData.export.filename}`);
console.log(
  `Total leads: ${exportData.export.leadCount} across ${exportData.export.queryCount} queries`
);
```
