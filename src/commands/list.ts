import { Command } from "commander";
import { readConfig } from "../config.js";
import { green, yellow } from "../utils.js";

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List all registered accounts")
    .action(() => {
      const config = readConfig();
      const accounts = Object.entries(config.accounts);

      if (accounts.length === 0) {
        console.log(yellow("No accounts registered. Use `zit add` to register one."));
        return;
      }

      console.log(green("Registered accounts:\n"));

      const maxNameLen = Math.max(...accounts.map(([key]) => key.length));

      for (const [key, acc] of accounts) {
        console.log(`  ${key.padEnd(maxNameLen + 2)} ${acc.email}`);
      }
    });
}
