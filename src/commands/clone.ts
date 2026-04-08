import { Command } from "commander";
import { execSync } from "node:child_process";
import { readConfig, findWorkspaceByPath } from "../config.js";
import { red, green, yellow, collapseHome } from "../utils.js";

export function registerCloneCommand(program: Command): void {
  program
    .command("clone <url>")
    .description("Clone a repo using the current workspace's SSH key")
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .action((url: string, _opts: unknown, cmd: Command) => {
      const cwd = process.cwd();
      const match = findWorkspaceByPath(cwd);

      if (!match) {
        console.log(red("Not inside a zit workspace."));

        const config = readConfig();
        const workspaces = Object.entries(config.workspaces);
        if (workspaces.length > 0) {
          console.log("\nAvailable workspaces:");
          for (const [name, ws] of workspaces) {
            console.log(`  ${name}  ${collapseHome(ws.path)}`);
          }
          console.log(
            yellow(
              "\ncd into a workspace folder first, then run `zit clone <url>`."
            )
          );
        } else {
          console.log(
            yellow(
              "Create a workspace first: `zit workspace init <path> <account>`"
            )
          );
        }
        process.exit(1);
      }

      const { name, workspace } = match;
      const config = readConfig();
      const account = config.accounts[workspace.account];

      if (!account) {
        console.log(
          red(
            `Account "${workspace.account}" referenced by workspace "${name}" not found.`
          )
        );
        process.exit(1);
      }

      // Collect any extra args passed after the url
      const extraArgs = cmd.args.slice(1).join(" ");

      const sshCommand = `ssh -i ${account.private_key} -o IdentitiesOnly=yes`;

      console.log(
        `Cloning with account "${workspace.account}" (${account.email})...`
      );

      try {
        const fullCmd = `GIT_SSH_COMMAND='${sshCommand}' git clone ${url}${extraArgs ? " " + extraArgs : ""}`;
        execSync(fullCmd, { stdio: "inherit", cwd });
        console.log(green("\nClone complete. Push/pull will use this identity automatically."));
      } catch {
        console.log(red("\nClone failed."));
        process.exit(1);
      }
    });
}
