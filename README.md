[![Marketplace](https://img.shields.io/badge/GitHub%20Action-RepoForge.io%20Publish-blue?logo=github)](https://github.com/marketplace/actions/repoforge-publish)


# RepoForge.io Publish Action

![RepoForge.io logo](./img/logo.png)

**[GitHub Packages doesn't support Python packages](https://repoforge.io/blog/posts/github-packages-python/). This action publishes them, along with Docker images, npm, Conda and Debian packages, to a private [RepoForge.io](https://repoforge.io) registry, so you can host and install private Python packages from GitHub.**

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
| Conda        | ✅          | Upload pre-built `.conda` / `.tar.bz2` files to a channel |
| Debian       | ✅          | Upload pre-built `.deb` files |



## 🔧 Inputs

Inputs vary based on the selected `package_type`.

### Core Inputs (All Types)

| Name         | Required | Description |
|--------------|----------|-------------|
| `package_type` | ✅ | `python`, `docker`, `npm`, `conda` or `debian` |
| `api_token`  | ✅ | Access token from RepoForge.io (must have upload/write permissions for selected type) |
| `hash_id`    | ✅ | Your RepoForge.io account hash ID (used in URLs) |

### Python Inputs

The action uploads pre-built distributions with [twine](https://twine.readthedocs.io/), installing it with `pip` if it isn't already available to the `python` on `PATH`.

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
| `package_dir` | ❌ | Path to your NPM package directory (default: `"./dist"`) |

---

### Conda Inputs

The action uploads pre-built packages, so build them in an earlier step (e.g. with `rattler-build` or `conda-build`).

| Name         | Required | Description |
|--------------|----------|-------------|
| `channel_name` | ✅ when `package_type=conda` | Conda channel to upload to. It must already exist in RepoForge.io |
| `package_dir` | ❌ | Directory containing `.conda` / `.tar.bz2` files, searched recursively so `noarch/` and `linux-64/` subdirectories work (default: `./dist`) |
| `fail_on_conflict` | ❌ | Whether to fail if the package already exists in the channel. If `false`, existing packages are skipped (default: `false`) |

---

### Debian Inputs

The action uploads pre-built packages, so build them in an earlier step (e.g. with `dpkg-deb` or `nfpm`).

| Name         | Required | Description |
|--------------|----------|-------------|
| `package_dir` | ❌ | Directory containing `.deb` files, searched recursively (default: `./dist`) |
| `fail_on_conflict` | ❌ | Whether to fail if the same version of the package and architecture already exists. If `false`, it is skipped (default: `false`) |

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
- For Conda: enable "Conda - Full access"
- For Debian: enable "Debian - Full access"

![Access Token Screenshot](./img/api-token.png)

## 🧪 Usage

For more examples, refer to the repository [here](https://github.com/RepoForge-io/repoforge-publish-action-test)

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
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Build
        run: |
          pip install build
          python -m build

      - name: Publish package
        uses: RepoForge-io/repoforge-publish-action@v1
        with:
          package_type: python
          api_token: ${{ secrets.REPOFORGE_TOKEN }}
          hash_id: ${{ secrets.REPOFORGE_HASH_ID }}
          package_dir: ./dist
```

### Conda

```yaml
      - name: Build
        run: rattler-build build --recipe recipe/ --output-dir dist

      - uses: RepoForge-io/repoforge-publish-action@v1
        with:
          package_type: conda
          api_token: ${{ secrets.REPOFORGE_TOKEN }}
          hash_id: ${{ secrets.REPOFORGE_HASH_ID }}
          channel_name: my-channel
          package_dir: ./dist
```

### Debian

```yaml
      - name: Build
        run: dpkg-deb --build my-package dist/my-package_1.0.0_amd64.deb

      - uses: RepoForge-io/repoforge-publish-action@v1
        with:
          package_type: debian
          api_token: ${{ secrets.REPOFORGE_TOKEN }}
          hash_id: ${{ secrets.REPOFORGE_HASH_ID }}
          package_dir: ./dist
```

---

## 📥 Installing your package

Installs use the same repository URL shown in the Hash ID screenshot above, authenticated with an API token: any username, with the token as the password. Use a read-only token (e.g. "Python - Read only") for installs.

### pip

```bash
pip install your-package \
  --index-url https://token:${REPOFORGE_TOKEN}@api.repoforge.io/<hash_id>/
```

### uv

In `pyproject.toml`:

```toml
[[tool.uv.index]]
name = "repoforge"
url = "https://api.repoforge.io/<hash_id>/"
```

Then provide the credentials through the environment:

```bash
export UV_INDEX_REPOFORGE_USERNAME=token
export UV_INDEX_REPOFORGE_PASSWORD=$REPOFORGE_TOKEN
```

### Poetry

```bash
poetry source add --priority=supplemental repoforge https://api.repoforge.io/<hash_id>/
poetry config http-basic.repoforge token $REPOFORGE_TOKEN
```

### In another workflow

```yaml
      - name: Install dependencies
        env:
          REPOFORGE_TOKEN: ${{ secrets.REPOFORGE_READ_TOKEN }}
        run: |
          pip install -r requirements.txt \
            --index-url https://token:${REPOFORGE_TOKEN}@api.repoforge.io/<hash_id>/
```

For installing Docker, npm, Conda and Debian packages, see the [RepoForge.io documentation](https://help.repoforge.io).

---

## 📍 Roadmap

* [x] Python (twine)
* [x] Docker (OCI image push)
* [x] NPM (scoped package)
* [x] Conda (pre-built packages)
* [x] Debian (pre-built packages)

---

## 🔗 Links

* 🌐 [RepoForge.io](https://repoforge.io)
* 🐙 [This GitHub Action](https://github.com/RepoForge-io/repoforge-publish-action)
* 📖 [RepoForge.io Documentation](https://help.repoforge.io)

New to RepoForge? [Start a 14-day free trial](https://app.repoforge.io/registration/signup), no card needed.

---

© [RepoForge.io](https://repoforge.io)
