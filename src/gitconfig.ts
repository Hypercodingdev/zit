import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { ensureTrailingSlash } from "./utils.js";

function getGlobalGitconfigPath(): string {
  return path.join(os.homedir(), ".gitconfig");
}

/**
 * Add an includeIf entry to ~/.gitconfig for a workspace.
 * Format:
 *   [includeIf "gitdir:<path>/"]
 *       path = <gitconfig_path>
 */
export function addIncludeIf(
  workspacePath: string,
  gitconfigPath: string
): void {
  const globalPath = getGlobalGitconfigPath();
  const dirPattern = ensureTrailingSlash(workspacePath);

  let content = "";
  if (fs.existsSync(globalPath)) {
    content = fs.readFileSync(globalPath, "utf-8");
  }

  // Check if this includeIf already exists
  const marker = `[includeIf "gitdir:${dirPattern}"]`;
  if (content.includes(marker)) {
    // Update the path in case it changed
    const lines = content.split("\n");
    const idx = lines.findIndex((l) => l.trim() === marker);
    if (idx !== -1 && idx + 1 < lines.length) {
      lines[idx + 1] = `\tpath = ${gitconfigPath}`;
    }
    fs.writeFileSync(globalPath, lines.join("\n"), "utf-8");
    return;
  }

  // Append new entry
  const entry = `\n${marker}\n\tpath = ${gitconfigPath}\n`;
  fs.writeFileSync(globalPath, content + entry, "utf-8");
}

/**
 * Remove an includeIf entry from ~/.gitconfig for a workspace.
 */
export function removeIncludeIf(workspacePath: string): void {
  const globalPath = getGlobalGitconfigPath();
  if (!fs.existsSync(globalPath)) return;

  const dirPattern = ensureTrailingSlash(workspacePath);
  const marker = `[includeIf "gitdir:${dirPattern}"]`;

  const content = fs.readFileSync(globalPath, "utf-8");
  if (!content.includes(marker)) return;

  const lines = content.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i].trim() === marker) {
      // Skip this line and any indented lines that follow (the section body)
      i++;
      while (i < lines.length && /^\s+/.test(lines[i]) && lines[i].trim()) {
        i++;
      }
      // Skip trailing blank line
      if (i < lines.length && lines[i].trim() === "") {
        i++;
      }
      continue;
    }
    result.push(lines[i]);
    i++;
  }

  fs.writeFileSync(globalPath, result.join("\n"), "utf-8");
}

/**
 * Write a per-workspace .gitconfig file with user identity and SSH command.
 */
export function writeWorkspaceGitconfig(
  gitconfigPath: string,
  userName: string,
  userEmail: string,
  privateKeyPath: string
): void {
  const dir = path.dirname(gitconfigPath);
  fs.mkdirSync(dir, { recursive: true });

  const content = `[user]
\tname = ${userName}
\temail = ${userEmail}
[core]
\tsshCommand = ssh -i ${privateKeyPath} -o IdentitiesOnly=yes
`;

  fs.writeFileSync(gitconfigPath, content, "utf-8");
}

/**
 * Remove a per-workspace .gitconfig file.
 */
export function removeWorkspaceGitconfig(gitconfigPath: string): void {
  if (fs.existsSync(gitconfigPath)) {
    fs.unlinkSync(gitconfigPath);
  }
}
