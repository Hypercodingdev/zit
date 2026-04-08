import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";
import { execSync } from "node:child_process";

export type SshKeyType =
  | "ed25519"
  | "rsa"
  | "ecdsa"
  | "ecdsa-sk"
  | "ed25519-sk"
  | "dsa";

const VALID_KEY_TYPES: SshKeyType[] = [
  "ed25519",
  "rsa",
  "ecdsa",
  "ecdsa-sk",
  "ed25519-sk",
  "dsa",
];

export function isValidKeyType(t: string): t is SshKeyType {
  return VALID_KEY_TYPES.includes(t as SshKeyType);
}

export function getSshKeyPath(
  accountName: string,
  keyType: SshKeyType
): { privateKey: string; publicKey: string } {
  const sshDir = path.join(os.homedir(), ".ssh");
  const base = path.join(sshDir, `id_${keyType}_${accountName}`);
  return {
    privateKey: base,
    publicKey: base + ".pub",
  };
}

export function generateSshKey(
  email: string,
  privateKeyPath: string,
  keyType: SshKeyType
): string {
  const sshDir = path.dirname(privateKeyPath);
  fs.mkdirSync(sshDir, { recursive: true });

  execSync(
    `ssh-keygen -t ${keyType} -C "${email}" -f "${privateKeyPath}" -N ""`,
    { stdio: "inherit" }
  );

  const publicKey = fs.readFileSync(privateKeyPath + ".pub", "utf-8").trim();
  return publicKey;
}

export function removeSshKey(privateKeyPath: string): void {
  if (fs.existsSync(privateKeyPath)) {
    fs.unlinkSync(privateKeyPath);
  }
  const pubPath = privateKeyPath + ".pub";
  if (fs.existsSync(pubPath)) {
    fs.unlinkSync(pubPath);
  }
}
