import { Command } from "commander";
import { readConfig, writeConfig } from "../config.js";
import { getSshKeyPath, generateSshKey, isValidKeyType } from "../ssh.js";
import { prompt, promptYesNo, green, red, yellow } from "../utils.js";
import type { SshKeyType } from "../ssh.js";

export function registerAddCommand(program: Command): void {
  program
    .command("add")
    .description("Register a new git account with SSH key generation")
    .option("-t, --type <type>", "SSH key type (ed25519, rsa, ecdsa, ...)", "ed25519")
    .action(async (opts: { type: string }) => {
      if (!isValidKeyType(opts.type)) {
        console.log(red(`Invalid key type: ${opts.type}`));
        console.log("Valid types: ed25519, rsa, ecdsa, ecdsa-sk, ed25519-sk, dsa");
        process.exit(1);
      }

      const keyType = opts.type as SshKeyType;
      const accountName = await prompt("Account name: ");
      if (!accountName) {
        console.log(red("Account name is required."));
        process.exit(1);
      }

      const config = readConfig();

      if (config.accounts[accountName]) {
        const overwrite = await promptYesNo(
          `Account "${accountName}" already exists. Overwrite?`
        );
        if (!overwrite) {
          console.log(yellow("Cancelled."));
          return;
        }
      }

      const userName = await prompt("Git user name: ");
      const userEmail = await prompt("Git email: ");

      if (!userName || !userEmail) {
        console.log(red("Name and email are required."));
        process.exit(1);
      }

      const { privateKey, publicKey: publicKeyPath } = getSshKeyPath(
        accountName,
        keyType
      );

      console.log(`\nGenerating ${keyType} SSH key...`);
      const publicKey = generateSshKey(userEmail, privateKey, keyType);

      config.accounts[accountName] = {
        name: userName,
        email: userEmail,
        private_key: privateKey,
        public_key: publicKeyPath,
      };

      writeConfig(config);

      console.log(green("\nYour SSH public key:"));
      console.log(publicKey);
      console.log(green("\nPaste this key into your GitHub/GitLab SSH settings."));
      console.log(green(`Account "${accountName}" registered successfully.`));
    });
}
