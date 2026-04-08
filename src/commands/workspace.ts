import * as fs from "node:fs";
import { Command } from "commander";
import {
  readConfig,
  writeConfig,
  getWorkspaceGitconfigPath,
} from "../config.js";
import {
  addIncludeIf,
  removeIncludeIf,
  writeWorkspaceGitconfig,
  removeWorkspaceGitconfig,
} from "../gitconfig.js";
import { resolvePath, collapseHome, green, red, yellow } from "../utils.js";

export function registerWorkspaceCommand(program: Command): void {
  const ws = program
    .command("workspace")
    .alias("wsp")
    .description("Manage workspace folders linked to accounts (alias: wsp)");

  ws.command("init <path> <account>")
    .description("Create a workspace folder linked to an account")
    .action((wsPath: string, accountName: string) => {
      const config = readConfig();
      const account = config.accounts[accountName];

      if (!account) {
        console.log(red(`Account "${accountName}" not found.`));
        console.log("Use `zit list` to see registered accounts.");
        process.exit(1);
      }

      const resolvedPath = resolvePath(wsPath);

      // Check if a workspace already exists for this path
      for (const [name, existing] of Object.entries(config.workspaces)) {
        if (resolvePath(existing.path) === resolvedPath) {
          console.log(
            yellow(
              `Workspace "${name}" already exists for this path. Updating account to "${accountName}".`
            )
          );
          // Update existing workspace
          existing.account = accountName;
          const gitconfigPath = getWorkspaceGitconfigPath(name);
          writeWorkspaceGitconfig(
            gitconfigPath,
            account.name,
            account.email,
            account.private_key
          );
          writeConfig(config);
          console.log(green(`Workspace "${name}" updated.`));
          return;
        }
      }

      // Create the folder
      fs.mkdirSync(resolvedPath, { recursive: true });

      // Derive workspace name from the folder name
      const wsName = resolvedPath.split("/").filter(Boolean).pop()!;

      // Check name collision
      let finalName = wsName;
      if (config.workspaces[finalName]) {
        let i = 2;
        while (config.workspaces[`${wsName}-${i}`]) i++;
        finalName = `${wsName}-${i}`;
      }

      // Generate workspace gitconfig
      const gitconfigPath = getWorkspaceGitconfigPath(finalName);
      writeWorkspaceGitconfig(
        gitconfigPath,
        account.name,
        account.email,
        account.private_key
      );

      // Add includeIf to ~/.gitconfig
      addIncludeIf(resolvedPath, gitconfigPath);

      // Save workspace to config
      config.workspaces[finalName] = {
        path: resolvedPath,
        account: accountName,
      };
      writeConfig(config);

      console.log(green(`Workspace "${finalName}" created.`));
      console.log(`  Path:    ${collapseHome(resolvedPath)}`);
      console.log(`  Account: ${accountName} (${account.email})`);
      console.log(
        `\nRepos cloned inside ${collapseHome(resolvedPath)} will use this identity automatically.`
      );
    });

  ws.command("list")
    .description("List all workspaces and their linked accounts")
    .action(() => {
      const config = readConfig();
      const workspaces = Object.entries(config.workspaces);

      if (workspaces.length === 0) {
        console.log(
          yellow(
            "No workspaces configured. Use `zit workspace init <path> <account>` to create one."
          )
        );
        return;
      }

      console.log(green("Workspaces:\n"));

      const maxNameLen = Math.max(...workspaces.map(([name]) => name.length));
      const maxPathLen = Math.max(
        ...workspaces.map(([, ws]) => collapseHome(ws.path).length)
      );

      for (const [name, ws] of workspaces) {
        console.log(
          `  ${name.padEnd(maxNameLen + 2)} ${collapseHome(ws.path).padEnd(maxPathLen + 2)} ${ws.account}`
        );
      }
    });

  ws.command("remove <name>")
    .description("Unlink a workspace (keeps the folder and repos)")
    .action((name: string) => {
      const config = readConfig();
      const workspace = config.workspaces[name];

      if (!workspace) {
        console.log(red(`Workspace "${name}" not found.`));
        console.log("Use `zit workspace list` to see available workspaces.");
        process.exit(1);
      }

      // Remove includeIf from ~/.gitconfig
      removeIncludeIf(workspace.path);

      // Remove workspace gitconfig file
      removeWorkspaceGitconfig(getWorkspaceGitconfigPath(name));

      // Remove from config
      delete config.workspaces[name];
      writeConfig(config);

      console.log(green(`Workspace "${name}" removed.`));
      console.log(
        yellow(
          "The folder and its repos still exist, but they no longer use the linked identity."
        )
      );
    });
}
