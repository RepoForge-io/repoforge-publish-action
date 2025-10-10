[![Marketplace](https://img.shields.io/badge/GitHub%20Action-RepoForge.io%20Publish-blue?logo=github)](https://github.com/marketplace/actions/repoforge-publish)


# RepoForge.io Publish Action

![RepoForge.io logo](./img/logo.png)

**GitHub Action to publish Python, Docker, and NPM packages to [RepoForge.io](https://repoforge.io)**

Supports future extensibility (Conda, Debian coming soon).

## 📦 About RepoForge.io

[RepoForge.io](https://repoforge.io) is a modern, ultra-fast package registry supporting Python, Docker, NPM, and more.

- Built for developers, by developers.
- Clean UI, fast CLI workflows.
- Affordable, encrypted, no nonsense.


## 🚀 Supported Package Types

| Package Type | Supported? | Notes |
|--------------|------------|-------|
| Python       | ✅          | Upload `.tar.gz` / `.whl` using Twine |
| Docker       | ✅          | Authenticated push to RepoForge.io container registry |
| NPM          | ✅          | Scoped NPM publishing with token-based auth |
| Conda        | 🔜          | Coming soon |
| Debian       | 🔜          | Coming soon |



## 🔧 Inputs

Inputs vary based on the selected `package_type`.

### Core Inputs (All Types)

| Name         | Required | Description |
|--------------|----------|-------------|
| `package_type` | ✅ | `python`, `docker`, or `npm` |
| `api_token`  | ✅ | Access token from RepoForge.io (must have upload/write permissions for selected type) |
| `hash_id`    | ✅ | Your RepoForge.io account hash ID (used in URLs) |

### Python Inputs

| Name         | Required | Description |
|--------------|----------|-------------|
| `package_dir` | ❌ | Directory containing Python build artifacts (default: `./dist`) |
| `fail_on_conflict` | ❌ | Whether to fail if package version already exists (default: `false`) |

---

### Docker Inputs

| Name         | Required | Description |
|--------------|----------|-------------|
| `registry_name` | ✅ when `package_type=docker` | Name of your Docker repository |
| `docker_context` | ❌ | Build context directory (default: `"."`) |
| `dockerfile` | ❌ | Path to Dockerfile relative to context (default: `"Dockerfile"`) |
| `docker_tag` | ❌ | Image tag to use (default: `"latest"`) |

---

### NPM Inputs

| Name         | Required | Description |
|--------------|----------|-------------|
| `package_dir` | ❌ | Path to your NPM package directory (default: `"./npm"`) |

---

## 📸 Where to Find Your RepoForge.io Credentials

### Hash ID
Your **Hash ID** is visible under your RepoForge.io account details:

![Hash ID Screenshot](./img/hash-id.png)

### API Token
Create a **new API token** in RepoForge.io settings:

- Must have write/upload permission for the intended package type
- For Docker: enable "Docker - Full access"
- For Python: enable "Python - Full access"
- For NPM: enable "NPM - Full access"

![Access Token Screenshot](./img/api-token.png)

## 🧪 Usage

For more examples, refer to the repository [here](https://github.com/RepoForgeHQ/repoforge-publish-action-test)

```yaml
name: Publish to RepoForge.io

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v3

      - name: Use Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Publish package
        uses: RepoForgeHQ/repoforge-publish-action@main
        with:
          package_type: python  # or docker / npm
          api_token: ${{ secrets.REPOFORGE_TOKEN }}
          hash_id: ${{ secrets.REPOFORGE_HASH_ID }}
          package_dir: ./dist
````

---

## 📍 Roadmap

* [x] Python (twine)
* [x] Docker (OCI image push)
* [x] NPM (scoped package)
* [ ] Conda (coming soon)
* [ ] Debian (coming soon)

---

## 🔗 Links

* 🌐 [RepoForge.io](https://repoforge.io)
* 🐙 [This GitHub Action](https://github.com/RepoForgeHQ/repoforge-publish-action)
* 📖 [RepoForge.io Documentation](https://help.repoforge.io)

---

© [RepoForge.io](https://repoforge.io)
