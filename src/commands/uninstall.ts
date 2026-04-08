import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { Command } from "commander";
import { readConfig, getConfigPath } from "../config.js";
import { removeIncludeIf, removeWorkspaceGitconfig } from "../gitconfig.js";
import { getWorkspaceGitconfigPath } from "../config.js";
import { removeSshKey } from "../ssh.js";
import { prompt, promptYesNo, red, green, yellow, bold } from "../utils.js";

const COMPLETION_LINE = 'eval "$(zit completion)"';

function removeCompletionFromProfile(): string | null {
  const shell = process.env.SHELL || "";
  let profile: string;
  if (shell.includes("zsh")) {
    profile = path.join(os.homedir(), ".zshrc");
  } else if (shell.includes("bash")) {
    profile = path.join(os.homedir(), ".bashrc");
  } else {
    return null;
  }

  if (!fs.existsSync(profile)) return null;

  const content = fs.readFileSync(profile, "utf-8");
  if (!content.includes(COMPLETION_LINE)) return null;

  // Remove the completion line and its comment
  const lines = content.split("\n");
  const result: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "# zit tab completion") {
      // Skip this line and the next (eval line)
      if (i + 1 < lines.length && lines[i + 1].includes(COMPLETION_LINE)) {
        i++;
        // Skip trailing blank line
        if (i + 1 < lines.length && lines[i + 1].trim() === "") {
          i++;
        }
        continue;
      }
    }
    if (lines[i].includes(COMPLETION_LINE)) {
      continue;
    }
    result.push(lines[i]);
  }

  fs.writeFileSync(profile, result.join("\n"), "utf-8");
  return profile;
}

export function registerUninstallCommand(program: Command): void {
  program
    .command("uninstall")
    .description("Remove all zit data: accounts, SSH keys, workspaces, configs")
    .option("--keep-keys", "Keep SSH keys in ~/.ssh/")
    .action(async (opts: { keepKeys?: boolean }) => {
      const config = readConfig();
      const accountCount = Object.keys(config.accounts).length;
      const workspaceCount = Object.keys(config.workspaces).length;

      console.log(bold("This will remove:\n"));

      if (workspaceCount > 0) {
        console.log(`  - ${workspaceCount} workspace(s) and their includeIf entries in ~/.gitconfig`);
      }
      if (accountCount > 0) {
        console.log(`  - ${accountCount} account(s) from zit config`);
        if (!opts.keepKeys) {
          console.log(`  - SSH keys for each account in ~/.ssh/`);
        }
      }
      console.log(`  - zit config directory (~/.config/zit/)`);
      console.log(`  - Tab completion from shell profile`);
      console.log(yellow(`\n  Note: Workspace folders and repos inside them will NOT be deleted.`));
      console.log(yellow(`  Run \`npm uninstall -g @hypercodingdev/zit\` after to remove the CLI.\n`));

      const confirm = await promptYesNo("Proceed with uninstall?");
      if (!confirm) {
        console.log("Cancelled.");
        return;
      }

      // 1. Remove all workspace includeIf entries and gitconfig files
      for (const [name, ws] of Object.entries(config.workspaces)) {
        removeIncludeIf(ws.path);
        removeWorkspaceGitconfig(getWorkspaceGitconfigPath(name));
        console.log(`  Removed workspace "${name}"`);
      }

      // 2. Remove SSH keys (unless --keep-keys)
      if (!opts.keepKeys) {
        for (const [name, acc] of Object.entries(config.accounts)) {
          removeSshKey(acc.private_key);
          console.log(`  Removed SSH keys for "${name}"`);
        }
      } else {
        console.log(yellow("  Keeping SSH keys (--keep-keys)"));
      }

      // 3. Remove config directory
      const configDir = path.dirname(getConfigPath());
      fs.rmSync(configDir, { recursive: true, force: true });
      console.log("  Removed ~/.config/zit/");

      // 4. Remove completion from shell profile
      const profile = removeCompletionFromProfile();
      if (profile) {
        console.log(`  Removed tab completion from ${profile}`);
      }

      console.log(green("\nzit has been uninstalled."));
      console.log(`Run \`npm uninstall -g @hypercodingdev/zit\` to remove the CLI.`);
    });
}
