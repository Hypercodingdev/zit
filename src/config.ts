import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as ini from "ini";

export interface Account {
  name: string;
  email: string;
  private_key: string;
  public_key: string;
}

export interface Workspace {
  path: string;
  account: string;
}

export interface ZitConfig {
  accounts: Record<string, Account>;
  workspaces: Record<string, Workspace>;
}

function getConfigDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg || path.join(os.homedir(), ".config");
  return path.join(base, "zit");
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), "config");
}

export function getWorkspacesDir(): string {
  return path.join(getConfigDir(), "workspaces");
}

export function getWorkspaceGitconfigPath(name: string): string {
  return path.join(getWorkspacesDir(), `${name}.gitconfig`);
}

function ensureConfigDir(): void {
  const dir = getConfigDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(getWorkspacesDir(), { recursive: true });
}

export function readConfig(): ZitConfig {
  const configPath = getConfigPath();
  const config: ZitConfig = { accounts: {}, workspaces: {} };

  if (!fs.existsSync(configPath)) {
    return config;
  }

  const raw = fs.readFileSync(configPath, "utf-8");
  const parsed = ini.parse(raw);

  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== "object" || value === null) continue;

    // Workspace sections are stored as: [workspace "name"]
    const wsMatch = key.match(/^workspace\s+"(.+)"$/);
    if (wsMatch && "path" in value && "account" in value) {
      config.workspaces[wsMatch[1]] = value as unknown as Workspace;
      continue;
    }

    // Account sections
    if (
      "name" in value &&
      "email" in value &&
      "private_key" in value &&
      "public_key" in value
    ) {
      config.accounts[key] = value as unknown as Account;
    }
  }

  return config;
}

export function writeConfig(config: ZitConfig): void {
  ensureConfigDir();
  const configPath = getConfigPath();

  const obj: Record<string, Record<string, string>> = {};

  for (const [key, acc] of Object.entries(config.accounts)) {
    obj[key] = {
      name: acc.name,
      email: acc.email,
      private_key: acc.private_key,
      public_key: acc.public_key,
    };
  }

  for (const [key, ws] of Object.entries(config.workspaces)) {
    obj[`workspace "${key}"`] = {
      path: ws.path,
      account: ws.account,
    };
  }

  fs.writeFileSync(configPath, ini.stringify(obj), "utf-8");
}

export function getAccount(name: string): Account | undefined {
  const config = readConfig();
  return config.accounts[name];
}

export function getWorkspace(name: string): Workspace | undefined {
  const config = readConfig();
  return config.workspaces[name];
}

export function findWorkspaceByPath(dir: string): {
  name: string;
  workspace: Workspace;
} | null {
  const config = readConfig();
  const resolved = path.resolve(dir);

  let bestMatch: { name: string; workspace: Workspace } | null = null;
  let bestLen = 0;

  for (const [name, ws] of Object.entries(config.workspaces)) {
    const wsPath = path.resolve(ws.path);
    if (
      (resolved === wsPath || resolved.startsWith(wsPath + "/")) &&
      wsPath.length > bestLen
    ) {
      bestMatch = { name, workspace: ws };
      bestLen = wsPath.length;
    }
  }

  return bestMatch;
}
