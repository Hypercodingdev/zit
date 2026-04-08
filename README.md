# zit

A folder-based Git identity manager. Associate workspace folders with Git accounts — SSH keys, author name, and email are applied automatically to every repo inside.

**No manual switching.** No ssh-agent. No shell hooks. Uses git's native `includeIf` to make it work everywhere — terminal, VS Code, JetBrains, any git client.

## How It Works

1. Register your git accounts with `zit add`
2. Create workspace folders linked to accounts with `zit workspace init`
3. Clone repos inside workspace folders with `zit clone`
4. After that, `git push`, `git pull`, `git commit` — everything uses the correct identity automatically

Under the hood, `zit` uses:
- **`includeIf "gitdir:"`** — git's native conditional config that auto-loads identity settings based on repo location
- **`core.sshCommand`** — tells git which SSH key to use, no ssh-agent needed

## Installation

```shell
npm install -g @hypercodingdev/zit
```

Requires Node.js >= 18, `git`, and `ssh-keygen`.

After installing, run this to enable tab completion (recommended):

```shell
zit completion --install
```

This adds auto-complete to your shell so you can type `zit <tab>` to see commands, `zit remove <tab>` to see account names, etc. Restart your shell or run `source ~/.zshrc` (or `~/.bashrc`) to activate.

## Quick Start

```shell
# Register an account
zit add
# Account name: work
# Git user name: John Doe
# Git email: john@company.com
# → Generates SSH key, prints public key to paste into GitHub/GitLab

# Create a workspace folder linked to that account
zit workspace init ~/work work
# → Creates ~/work/, configures git includeIf

# Clone a repo inside the workspace
cd ~/work
zit clone git@github.com:my-org/my-repo.git

# From now on, git just works — no zit needed
cd ~/work/my-repo
git commit -m "uses work identity automatically"
git push  # uses work SSH key automatically
```

## Commands

All commands have short aliases for convenience.

| Command | Alias | Description |
|---------|-------|-------------|
| `zit add` | | Register a new git account |
| `zit remove <account>` | `zit rm` | Remove an account and SSH keys |
| `zit list` | `zit ls` | List all registered accounts |
| `zit workspace <sub>` | `zit wsp` | Manage workspace folders |
| `zit clone <url>` | | Clone with workspace SSH key |
| `zit status` | | Show current workspace info |
| `zit completion` | | Output shell completion script |
| `zit uninstall` | | Remove all zit data and configs |

### `zit add`

Register a new git account interactively. Generates an SSH keypair.

```shell
zit add              # default: ed25519
zit add -t rsa       # specify key type
```

Supported key types: `ed25519` (default), `rsa`, `ecdsa`, `ecdsa-sk`, `ed25519-sk`, `dsa`

### `zit remove <account>`

Remove an account and its SSH keys. Alias: `zit rm`

```shell
zit remove work
zit remove work --force  # also removes linked workspaces
```

### `zit list`

List all registered accounts with their emails. Alias: `zit ls`

```shell
$ zit list
Registered accounts:

  personal    john@personal.com
  work        john@company.com
```

### `zit workspace init <path> <account>`

Create a workspace folder linked to an account. Alias: `zit wsp`

```shell
zit workspace init ~/work work
zit workspace init ~/personal personal
```

### `zit workspace list`

List all workspaces.

```shell
$ zit workspace list
Workspaces:

  work        ~/work          work
  personal    ~/personal      personal
```

### `zit workspace remove <name>`

Unlink a workspace. Keeps the folder and repos, but removes the identity link.

```shell
zit workspace remove work
```

### `zit clone <url>`

Clone a repo using the current workspace's SSH key. Must be run inside a workspace folder.

```shell
cd ~/work
zit clone git@github.com:org/repo.git
zit clone git@github.com:org/repo.git --depth 1  # extra git clone flags work
```

### `zit status`

Show the current directory's workspace and account info.

```shell
$ cd ~/work/my-repo && zit status
Workspace: work
Path:      ~/work
Account:   work
Name:      John Doe
Email:     john@company.com
SSH Key:   ~/.ssh/id_ed25519_work
```

## Uninstall

```shell
zit uninstall
```

This removes all zit data in one step:
- All workspace `includeIf` entries from `~/.gitconfig`
- All workspace gitconfig files
- All SSH keys for registered accounts (use `--keep-keys` to skip)
- The `~/.config/zit/` config directory
- Tab completion from your shell profile

Workspace folders and repos inside them are **not** deleted.

After running `zit uninstall`, remove the CLI itself:

```shell
npm uninstall -g @hypercodingdev/zit
```

## What zit Does to Your System

- **`~/.config/zit/config`** — stores registered accounts and workspace mappings
- **`~/.config/zit/workspaces/*.gitconfig`** — per-workspace git config files
- **`~/.gitconfig`** — adds `includeIf` entries (one per workspace)
- **`~/.ssh/id_<type>_<name>`** — SSH keypairs for each account

## Platform Support

- Linux
- macOS

## License

MIT
